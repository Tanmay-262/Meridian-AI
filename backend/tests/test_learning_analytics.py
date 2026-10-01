import pytest
import uuid
from datetime import datetime, date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from fastapi import Depends

from app.main import app
from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.document import Document
from app.models.learning import Flashcard, StudyLog

client = TestClient(app)

MOCK_USER_ID = 7777
MOCK_DOC_ID = 6666


def override_get_current_user(db: Session = Depends(get_db)):
    return db.query(User).filter(User.id == MOCK_USER_ID).first()


app.dependency_overrides[get_current_user] = override_get_current_user


@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    db_gen = get_db()
    db = next(db_gen)

    # Clean existing mocks
    db.query(StudyLog).filter(StudyLog.user_id == MOCK_USER_ID).delete()
    db.query(Flashcard).filter(Flashcard.user_id == MOCK_USER_ID).delete()
    db.query(Document).filter(Document.user_id == MOCK_USER_ID).delete()
    db.query(User).filter(User.id == MOCK_USER_ID).delete()
    db.commit()

    # Add mock user
    user = User(
        id=MOCK_USER_ID,
        email="analytics_tester@meridian.com",
        is_active=True,
        hashed_password="mock_hashed_password_ci",
    )
    db.add(user)
    db.commit()

    # Add mock doc
    doc = Document(
        id=MOCK_DOC_ID,
        user_id=MOCK_USER_ID,
        filename="analytics_doc.pdf",
        file_path="/app/uploads/analytics_doc.pdf",
        file_size=2048,
        status="completed",
    )
    db.add(doc)
    db.commit()

    yield db

    # Clean up
    db.query(StudyLog).filter(StudyLog.user_id == MOCK_USER_ID).delete()
    db.query(Flashcard).filter(Flashcard.user_id == MOCK_USER_ID).delete()
    db.query(Document).filter(Document.user_id == MOCK_USER_ID).delete()
    db.query(User).filter(User.id == MOCK_USER_ID).delete()
    db.commit()
    db.close()


def test_analytics_and_anki_export(setup_and_teardown_db):
    db = setup_and_teardown_db

    # Insert mock flashcards across different boxes
    c1 = Flashcard(id=str(uuid.uuid4()), user_id=MOCK_USER_ID, document_id=MOCK_DOC_ID, front="Q1", back="A1", box=1)
    c2 = Flashcard(id=str(uuid.uuid4()), user_id=MOCK_USER_ID, document_id=MOCK_DOC_ID, front="Q2", back="A2", box=3)
    c3 = Flashcard(id=str(uuid.uuid4()), user_id=MOCK_USER_ID, document_id=MOCK_DOC_ID, front="Q3", back="A3", box=5)
    db.add_all([c1, c2, c3])

    # Insert study logs for today and yesterday (streak = 2)
    today = date.today()
    log1 = StudyLog(user_id=MOCK_USER_ID, activity_date=today, cards_reviewed=5, correct_answers=4)
    log2 = StudyLog(user_id=MOCK_USER_ID, activity_date=today - timedelta(days=1), cards_reviewed=3, correct_answers=3)
    db.add_all([log1, log2])
    db.commit()

    # 1. Test /learning/analytics
    res = client.get("/api/v1/learning/analytics")
    assert res.status_code == 200
    data = res.json()
    assert data["total_flashcards"] == 3
    assert data["box_distribution"]["1"] == 1
    assert data["box_distribution"]["3"] == 1
    assert data["box_distribution"]["5"] == 1
    # Weighted sum = 1*1 + 1*3 + 1*5 = 9. Total max = 3 * 5 = 15. Mastery = 9/15 * 100 = 60.0%
    assert data["mastery_percentage"] == 60.0
    assert data["study_streak_days"] == 2
    assert data["total_reviews_done"] == 8

    # 2. Test /learning/export/anki/{document_id}
    res_anki = client.get(f"/api/v1/learning/export/anki/{MOCK_DOC_ID}")
    assert res_anki.status_code == 200
    assert res_anki.headers["content-type"].startswith("text/csv")
    csv_text = res_anki.text
    assert "Front,Back,Tags" in csv_text
    assert "Q1,A1," in csv_text
    assert "Q2,A2," in csv_text
    assert "Q3,A3," in csv_text
