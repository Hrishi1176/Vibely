import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import Base, get_db

# Isolated in-memory DB with StaticPool so all connections share the memory DB schema
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

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "Vibely" in data["app"]

def test_openapi_docs():
    response = client.get("/api/v1/docs")
    assert response.status_code == 200

def test_generate_username():
    response = client.get("/api/v1/auth/generate-username")
    assert response.status_code == 200
    assert "username" in response.json()
    assert len(response.json()["username"]) > 3

def test_register_and_login():
    reg_data = {
        "username": "testuser",
        "email": "test@vibely.ai",
        "password": "secretpassword123",
        "full_name": "Test User"
    }
    response = client.post("/api/v1/auth/register", json=reg_data)
    assert response.status_code == 201
    assert response.json()["username"] == "testuser"

    login_data = {
        "username": "testuser",
        "password": "secretpassword123"
    }
    response = client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 200
    token = response.json()["access_token"]
    assert token is not None

    headers = {"Authorization": f"Bearer {token}"}
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == "testuser"

def test_daily_post_and_quota():
    login_data = {"username": "testuser", "password": "secretpassword123"}
    token = client.post("/api/v1/auth/login", data=login_data).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    q_resp = client.get("/api/v1/quotas/my-quota", headers=headers)
    assert q_resp.status_code == 200
    initial_posts = q_resp.json()["posts_used"]

    post_data = {"content": "Testing Vibely backend posts and free daily quotas!", "vibe_tag": "#Test"}
    p_resp = client.post("/api/v1/posts", json=post_data, headers=headers)
    assert p_resp.status_code == 201
    assert p_resp.json()["content"] == post_data["content"]

    q_resp_after = client.get("/api/v1/quotas/my-quota", headers=headers)
    assert q_resp_after.json()["posts_used"] == initial_posts + 1
