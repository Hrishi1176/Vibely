import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_login_with_email():
    reg_data = {
        "username": "emailuser",
        "email": "user@example.com",
        "password": "secretpassword123",
        "full_name": "Email User"
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_data)
    assert reg_resp.status_code == 201

    # Login using EMAIL instead of username
    login_data = {
        "username": "user@example.com",
        "password": "secretpassword123"
    }
    login_resp = client.post("/api/v1/auth/login", data=login_data)
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

def test_google_auth_new_and_existing_user():
    # 1. New Google user signup
    google_data = {
        "email": "alex.google@example.com",
        "full_name": "Alex Rivera",
        "sub": "google_sub_123456"
    }
    resp = client.post("/api/v1/auth/google", json=google_data)
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    assert token is not None

    headers = {"Authorization": f"Bearer {token}"}
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == "alex.google@example.com"
    assert me_data["full_name"] == "Alex Rivera"

    # 2. Existing Google user login (same sub & email)
    resp2 = client.post("/api/v1/auth/google", json=google_data)
    assert resp2.status_code == 200
    assert "access_token" in resp2.json()
