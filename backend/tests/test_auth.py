import sys
import os
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app 
from database import get_session
from models import User, UserRole, Chore


def set_client_auth(client, role):
    """
    Registers a user, logs them in, and sets the auth cookie 
    on the provided client instance.
    """
    user_data = {
        "email": f"{role}@test.com",
        "password": "securepassword123",
        "display_name": role.capitalize()
    }
    client.post("/auth/register", json=user_data)
    login_res = client.post("/auth/login", json={"email": user_data["email"], "password": "securepassword123"})
    
    token = login_res.cookies.get("access_token")
    client.cookies.set("access_token", token)
    return token


TEST_DATABASE_URL = "sqlite://"
engine = create_engine(
    TEST_DATABASE_URL, 
    connect_args={"check_same_thread": False}, 
    poolclass=StaticPool
)

def override_get_session():
    with Session(engine) as session:
        yield session

app.dependency_overrides[get_session] = override_get_session
client = TestClient(app)

@pytest.fixture(name="session", autouse=True)
def session_fixture():
    SQLModel.metadata.create_all(engine)
    yield
    SQLModel.metadata.drop_all(engine)


def test_register_and_login_workflow():
    """Tests CWR.1.1 & CWR.1.4: Registration and Login set cookies"""
    reg_payload = {
        "email": "carla_test@example.com",
        "password": "securepassword123",
        "display_name": "Carla QA"
    }
    reg_res = client.post("/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    assert "access_token" in reg_res.cookies
    assert reg_res.json()["user"]["role"] == "parent" 

    login_payload = {
        "email": "carla_test@example.com",
        "password": "securepassword123"
    }
    login_res = client.post("/auth/login", json=login_payload)
    assert login_res.status_code == 200
    assert "access_token" in login_res.cookies
    assert login_res.json()["user"]["display_name"] == "Carla QA"

def test_password_security_validation():
    """Tests CWR.1.1: Uses Breanna's @field_validator logic"""
    payload = {
        "email": "bad_pass@example.com",
        "password": "123", 
        "display_name": "Bad Tester"
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422 
    assert "at least 8 characters" in response.text

def test_auth_me_protected_route():
    """Tests CWR.12.1: Protected routes using get_current_user"""
    response = client.get("/auth/me")
    assert response.status_code == 401
    assert "User account not found" in response.json()["detail"]

def test_logout_behavior():
    """Tests /auth/logout deletes the session cookie"""
    client.post("/auth/register", json={
        "email": "logout_test@example.com", 
        "password": "securepassword123", 
        "display_name": "Logout User"
    })
    
    client.post("/auth/login", json={
        "email": "logout_test@example.com", 
        "password": "securepassword123"
    })
    
    response = client.post("/auth/logout")
    assert response.status_code == 200
    token = response.cookies.get("access_token")
    assert token == "" or token is None

def test_duplicate_email_registration():
    """Tests Breanna's duplicate email check logic"""
    payload = {
        "email": "duplicate@example.com",
        "password": "securepassword123",
        "display_name": "Original"
    }
    client.post("/auth/register", json=payload)
    
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_cannot_approve_before_complete():
    """Constraint: Cannot approve a chore if it hasn't been marked 'completed'."""
    set_client_auth(client, "parent")
    
    payload = {"title": "Test Constraint", "points_worth": 50}
    res = client.post("/chores", json=payload)
    chore_id = res.json()["id"]

    appr_res = client.put(f"/chores/{chore_id}/approve")
    
    assert appr_res.status_code == 400
    assert "invalid chore state" in appr_res.json()["detail"].lower()


def test_child_cannot_approve_own_chore():
    set_client_auth(client, "child")

    response = client.put("/chores/1/approve") 
    
    assert response.status_code == 403


def test_child_cannot_assign_chore():
    set_client_auth(client, "child")
    
    response = client.patch("/chores/1/assign/2")
    
    assert response.status_code == 403


def test_parent_chore_lifecycle():
   set_client_auth(client, "parent")
    
    res = client.post("/chores", json={"title": "Mow Lawn"})
    chore_id = res.json()["id"]
    
    client.patch(f"/chores/{chore_id}/assign/1")
    
    appr_res = client.put(f"/chores/{chore_id}/approve")

    assert appr_res.status_code == 200


def test_create_chore_requires_auth():
    fresh_client = TestClient(app)

    res = fresh_client.post("/chores", json={
        "title": "Unauthorized",
        "points_worth": 50
    })

    assert res.status_code == 401


def test_invalid_token_rejected():
    res = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer garbage"}
    )
    assert res.status_code == 401





''' //using test_parent_chore_lifecycle instead
def test_chore_workflow():
    # 1. Create a chore
    payload = {"title": "Clean Room", "points_worth": 100}
    res = client.post("/chores", json=payload)
    assert res.status_code == 200
    chore_id = res.json()["id"]

    # 2. Complete it
    comp_res = client.post(f"/chores/{chore_id}/complete")
    assert comp_res.status_code == 200
    
    # 3. Approve it
    appr_res = client.post(f"/chores/{chore_id}/approve")
    assert appr_res.status_code == 200
    assert "points awarded" in appr_res.json()["message"]
'''
