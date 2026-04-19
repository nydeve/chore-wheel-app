import sys
import os
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine, select
from sqlmodel.pool import StaticPool

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from database import get_session
from models import User, UserRole
from utils import hash_password


# Test DB setup ---------------------------
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


# Fixtures ---------------------------
@pytest.fixture(name="session", autouse=True)
def session_fixture():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def setup_users(session):
    pwd = hash_password("securepassword123")
    
    parent = User(email="parent@test.com", hashed_password=pwd, role=UserRole.PARENT, display_name="Parent")
    child = User(email="child@test.com", hashed_password=pwd, role=UserRole.CHILD, display_name="Child")
    
    session.add(parent)
    session.add(child)
    session.commit()
    # Refresh to get IDs
    session.refresh(parent)
    session.refresh(child)
    return {"parent": parent, "child": child}


# Helper ---------------------------
def set_client_auth(client, role):
    email = f"{role}@test.com"

    login_res = client.post("/auth/login", json={
        "email": email,
        "password": "securepassword123"
    })

    assert login_res.status_code == 200, login_res.json()

    token = login_res.cookies.get("access_token")
    client.cookies.set("access_token", token)

    return token


# Tests ---------------------------
def test_register_and_login_workflow(client):
    reg_payload = {
        "email": "carla_test@example.com",
        "password": "securepassword123",
        "display_name": "Carla QA"
    }

    reg_res = client.post("/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    assert "access_token" in reg_res.cookies
    assert reg_res.json()["user"]["role"] == "parent"

    login_res = client.post("/auth/login", json={
        "email": reg_payload["email"],
        "password": reg_payload["password"]
    })

    assert login_res.status_code == 200
    assert "access_token" in login_res.cookies
    assert login_res.json()["user"]["display_name"] == "Carla QA"


def test_password_security_validation(client):
    payload = {
        "email": "bad_pass@example.com",
        "password": "123",
        "display_name": "Bad Tester"
    }

    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422
    assert "at least 8 characters" in response.text


def test_auth_me_protected_route(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_logout_behavior(client, setup_users):
    client.post("/auth/login", json={
        "email": "parent@test.com",
        "password": "securepassword123"
    })

    response = client.post("/auth/logout")
    assert response.status_code == 200

    token = response.cookies.get("access_token")
    assert token == "" or token is None


def test_duplicate_email_registration(client):
    payload = {
        "email": "duplicate@example.com",
        "password": "securepassword123",
        "display_name": "Original"
    }

    client.post("/auth/register", json=payload)
    response = client.post("/auth/register", json=payload)

    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_cannot_approve_before_complete(client):
    set_client_auth(client, "parent")

    res = client.post("/chores", json={
        "title": "Test Constraint",
        "points_worth": 50
    })
    assert res.status_code == 200, res.json()

    chore_id = res.json()["id"]

    appr_res = client.put(f"/chores/{chore_id}/approve")

    assert appr_res.status_code == 400
    assert "invalid chore state" in appr_res.json()["detail"].lower()


def test_child_cannot_approve_own_chore(client, setup_users):
    set_client_auth(client, "child")

    res = client.post("/chores", json={
        "title": "Test",
        "points_worth": 10
    })
    assert res.status_code == 200, res.json()

    chore_id = res.json()["id"]

    response = client.put(f"/chores/{chore_id}/approve")
    assert response.status_code == 403


def test_child_cannot_assign_chore(client, setup_users):
    set_client_auth(client, "parent")

    res = client.post("/chores", json={
        "title": "Test",
        "points_worth": 10
    })
    assert res.status_code == 200, res.json()

    chore_id = res.json()["id"]

    child_id = setup_users["child"].id

    set_client_auth(client, "child")

    response = client.patch(f"/chores/{chore_id}/assign/{child_id}")
    assert response.status_code == 403


def test_parent_chore_lifecycle(client, setup_users):
    set_client_auth(client, "parent")

    res = client.post("/chores", json={
        "title": "Mow Lawn",
        "points_worth": 15
    })
    assert res.status_code == 200, res.json()

    chore_id = res.json()["id"]
    parent_id = setup_users["parent"].id

    client.patch(f"/chores/{chore_id}/assign/{parent_id}")
    client.put(f"/chores/{chore_id}/complete")

    appr_res = client.put(f"/chores/{chore_id}/approve")
    assert appr_res.status_code == 200


def test_create_chore_requires_auth(client):
    fresh_client = TestClient(app)

    res = fresh_client.post("/chores", json={
        "title": "Unauthorized",
        "points_worth": 50
    })

    assert res.status_code == 401


def test_invalid_token_rejected(client):
    res = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer garbage"}
    )
    assert res.status_code == 401
