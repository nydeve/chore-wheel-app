import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from database import get_session
import sys
import os

# Ensure the app imports work properly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import app
from utils import hash_password, verify_password, create_access_token, decode_access_token
from models import UserRole, User, Chore, Reward

# Set up a test SQLite database instead of memory to avoid threading/connection drops
sqlite_url = "sqlite:///./test_chores.db"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

def get_session_override():
    with Session(engine) as session:
        yield session

# Override the database session dependency to use our test DB
app.dependency_overrides[get_session] = get_session_override

client = TestClient(app)

@pytest.fixture(autouse=True, name="session")
def session_fixture():
    # Create tables before each test and drop them after
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

# =========================================================================
# TEST CASE 1: TC003 (CWR.1.3) - Verify passwords are stored in hashed format
# =========================================================================
def test_password_hashing():
    plain_password = "SecurePassword123!"
    hashed = hash_password(plain_password)
    
    # Original password should not equal the hashed version
    assert plain_password != hashed
    
    # Hashed version should verify correctly against the original
    assert verify_password(plain_password, hashed) is True
    
    # Wrong password should fail verification
    assert verify_password("IncorrectPassword!", hashed) is False

# =========================================================================
# TEST CASE 2: TC004 (CWR.1.4) - Verify JWT token is issued for sessions
# =========================================================================
def test_jwt_token_generation():
    user_id = 99
    role = UserRole.PARENT.value
    
    # Generate token
    token = create_access_token(user_id=user_id, role=role)
    assert isinstance(token, str)
    assert len(token) > 0
    
    # Decode token and verify contents
    payload = decode_access_token(token)
    assert payload is not None
    assert payload.get("sub") == str(user_id)
    assert payload.get("role") == role

# =========================================================================
# TEST CASE 3: TC001 (CWR.1.1) - Verify user registration with valid email/pwd
# =========================================================================
def test_user_registration_success():
    response = client.post(
        "/auth/register",
        json={
            "email": "parent_test@example.com",
            "password": "StrongPassword2024!",
            "display_name": "Test Parent User"
        }
    )
    
    # Verify success response status
    assert response.status_code == 201
    
    data = response.json()
    assert data["message"] == "Account created! Welcome to Chore Wheel."
    assert "user" in data
    assert data["user"]["email"] == "parent_test@example.com"
    assert data["user"]["display_name"] == "Test Parent User"
    assert data["user"]["role"] == "parent"
    
    # Verify that the access_token cookie was successfully issued
    assert "access_token" in response.cookies
