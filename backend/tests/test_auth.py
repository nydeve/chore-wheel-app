import sys
import os
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app 
from database import get_session
from models import User  # Fixed: Removed 'auth.'

# --- SETUP: In-memory Database for Integration Testing ---
# creates a fresh, empty database in RAM for every test run
TEST_DATABASE_URL = "sqlite://"
engine = create_engine(
    TEST_DATABASE_URL, 
    connect_args={"check_same_thread": False}, 
    poolclass=StaticPool
)

def override_get_session():
    with Session(engine) as session:
        yield session

# Swap the real DB for the Test DB
app.dependency_overrides[get_session] = override_get_session
client = TestClient(app)

@pytest.fixture(name="session", autouse=True)
def session_fixture():
    SQLModel.metadata.create_all(engine)
    yield
    SQLModel.metadata.drop_all(engine)

# --- THE LOGIN SYSTEM TESTS ---

def test_register_and_login_workflow():
    """Tests CWR.1.1 & CWR.1.4: Registration and Login set cookies"""
    # 1. Register a new Parent
    reg_payload = {
        "email": "carla_test@example.com",
        "password": "securepassword123",
        "display_name": "Carla QA"
    }
    reg_res = client.post("/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    assert "access_token" in reg_res.cookies

    # 2. Login with those credentials
    login_payload = {
        "email": "carla_test@example.com",
        "password": "securepassword123"
    }
    login_res = client.post("/auth/login", json=login_payload)
    assert login_res.status_code == 200
    assert "access_token" in login_res.cookies
    assert login_res.json()["user"]["display_name"] == "Carla QA"

def test_password_security_validation():
    """Tests CWR.1.1: Password must be at least 8 characters"""
    payload = {
        "email": "bad_pass@example.com",
        "password": "123", # Too short
        "display_name": "Bad Tester"
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422 
    assert "at least 8 characters" in response.text

def test_auth_me_protected_route():
    """Tests CWR.12.1: Protected routes require valid login"""
    # Try to access /auth/me without a cookie
    response = client.get("/auth/me")
    assert response.status_code == 401 # Unauthorized

def test_logout_behavior():
    """Tests /auth/logout deletes the session cookie"""
    # Simulate a logged in state by setting a fake cookie or logging in
    client.post("/auth/login", json={"email": "carla_test@example.com", "password": "securepassword123"})
    
    response = client.post("/auth/logout")
    assert response.status_code == 200
    # access_token cookie should be gone or cleared
    assert response.cookies.get("access_token") in [None, ""]
