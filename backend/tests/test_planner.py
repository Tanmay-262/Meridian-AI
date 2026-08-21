import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.planner import PlannerEvent

client = TestClient(app)

# Test User
MOCK_USER_ID = 9999
MOCK_USER = User(
    id=MOCK_USER_ID,
    email="testplanner@meridian.com",
    is_active=True,
    hashed_password="mock_hashed_password_ci",
)


# Override dependencies for test isolation
def override_get_current_user():
    return MOCK_USER


app.dependency_overrides[get_current_user] = override_get_current_user


@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    # Setup: get database session
    db_gen = get_db()
    db = next(db_gen)

    # Ensure mock user exists in DB
    user_exists = db.query(User).filter(User.id == MOCK_USER_ID).first()
    if not user_exists:
        db.add(MOCK_USER)
        db.commit()

    # Clear any previous planner events
    db.query(PlannerEvent).filter(PlannerEvent.user_id == MOCK_USER_ID).delete()
    db.commit()

    yield db

    # Teardown: Clean up
    db.query(PlannerEvent).filter(PlannerEvent.user_id == MOCK_USER_ID).delete()
    db.commit()
    db.close()


def test_create_and_list_events(setup_and_teardown_db):
    # 1. Post new event
    event_data = {
        "title": "Strategy Meeting",
        "description": "Discuss next development steps",
        "start_time": "2026-08-22T10:00:00",
        "end_time": "2026-08-22T11:00:00",
        "priority": "medium",
    }
    response = client.post("/api/v1/planner/events", json=event_data)
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["title"] == "Strategy Meeting"
    assert res_data["priority"] == "medium"

    # 2. Get active events
    response = client.get("/api/v1/planner/events")
    assert response.status_code == 200
    events = response.json()
    assert len(events) == 1
    assert events[0]["title"] == "Strategy Meeting"


def test_conflict_auto_resolution(setup_and_teardown_db):
    db = setup_and_teardown_db

    # 1. Schedule high priority event: 14:00 to 15:00
    high_event = {
        "title": "Client Review",
        "description": "High priority client review meeting",
        "start_time": "2026-08-22T14:00:00",
        "end_time": "2026-08-22T15:00:00",
        "priority": "high",
    }
    r1 = client.post("/api/v1/planner/events", json=high_event)
    assert r1.status_code == 201

    # 2. Schedule overlapping low priority event: 14:30 to 15:30
    low_event = {
        "title": "Internal Catchup",
        "description": "Low priority internal chat",
        "start_time": "2026-08-22T14:30:00",
        "end_time": "2026-08-22T15:30:00",
        "priority": "low",
    }
    r2 = client.post("/api/v1/planner/events", json=low_event)
    assert r2.status_code == 201

    # 3. Trigger conflict resolution
    r_resolve = client.post("/api/v1/planner/resolve")
    assert r_resolve.status_code == 200
    assert "Rescheduled" in r_resolve.json()["message"]

    # 4. Verify shifted times in database
    db.expire_all()
    events = (
        db.query(PlannerEvent)
        .filter(PlannerEvent.user_id == MOCK_USER_ID)
        .order_by(PlannerEvent.start_time.asc())
        .all()
    )

    assert len(events) == 2
    # High event stays at 14:00 - 15:00
    assert events[0].title == "Client Review"
    assert events[0].start_time.strftime("%H:%M") == "14:00"
    assert events[0].end_time.strftime("%H:%M") == "15:00"

    # Low priority event is shifted to start exactly when high priority event ends (15:00 - 16:00)
    assert events[1].title == "Internal Catchup"
    assert events[1].start_time.strftime("%H:%M") == "15:00"
    assert events[1].end_time.strftime("%H:%M") == "16:00"
