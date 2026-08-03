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

def test_direct_messaging_flow():
    # Register User A
    u1 = client.post("/api/v1/auth/register", json={
        "username": "alice",
        "email": "alice@vibely.ai",
        "password": "password123",
        "full_name": "Alice Wonder"
    }).json()

    # Register User B
    u2 = client.post("/api/v1/auth/register", json={
        "username": "bob",
        "email": "bob@vibely.ai",
        "password": "password123",
        "full_name": "Bob Builder"
    }).json()

    # Login as User A
    token1 = client.post("/api/v1/auth/login", data={
        "username": "alice",
        "password": "password123"
    }).json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # Login as User B
    token2 = client.post("/api/v1/auth/login", data={
        "username": "bob",
        "password": "password123"
    }).json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # User A sends message to User B
    msg_resp = client.post(f"/api/v1/messages/{u2['id']}", json={"content": "Hey Bob! How are you?"}, headers=headers1)
    assert msg_resp.status_code == 201
    assert msg_resp.json()["content"] == "Hey Bob! How are you?"

    # User B checks message history
    history = client.get(f"/api/v1/messages/{u1['id']}", headers=headers2)
    assert history.status_code == 200
    assert len(history.json()) == 1
    assert history.json()[0]["content"] == "Hey Bob! How are you?"

    # User B checks conversations list
    convos = client.get("/api/v1/messages/conversations", headers=headers2)
    assert convos.status_code == 200
    assert len(convos.json()) == 1
    assert convos.json()[0]["user"]["username"] == "alice"
