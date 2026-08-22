import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, MagicMock

from app.main import app
from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.document import Document
from app.models.learning import Flashcard, QuizQuestion, MindMap

from fastapi import Depends

client = TestClient(app)

MOCK_USER_ID = 9999
MOCK_DOC_ID = 8888


def override_get_current_user(db: Session = Depends(get_db)):
    return db.query(User).filter(User.id == MOCK_USER_ID).first()


app.dependency_overrides[get_current_user] = override_get_current_user


@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    db_gen = get_db()
    db = next(db_gen)

    # Clean existing mocks
    db.query(Flashcard).filter(Flashcard.user_id == MOCK_USER_ID).delete()
    db.query(QuizQuestion).filter(QuizQuestion.user_id == MOCK_USER_ID).delete()
    db.query(MindMap).filter(MindMap.user_id == MOCK_USER_ID).delete()
    db.query(Document).filter(Document.user_id == MOCK_USER_ID).delete()
    db.query(User).filter(User.id == MOCK_USER_ID).delete()
    db.commit()

    # Add mock user
    user = User(
        id=MOCK_USER_ID,
        email="testlearner@meridian.com",
        is_active=True,
        hashed_password="mock_hashed_password_ci",
    )
    db.add(user)
    db.commit()

    # Add mock doc
    doc = Document(
        id=MOCK_DOC_ID,
        user_id=MOCK_USER_ID,
        filename="test_learning.pdf",
        file_path="/app/uploads/test_learning.pdf",
        file_size=1024,
        status="completed",
    )
    db.add(doc)
    db.commit()

    yield db

    # Clean up
    db.query(Flashcard).filter(Flashcard.user_id == MOCK_USER_ID).delete()
    db.query(QuizQuestion).filter(QuizQuestion.user_id == MOCK_USER_ID).delete()
    db.query(MindMap).filter(MindMap.user_id == MOCK_USER_ID).delete()
    db.query(Document).filter(Document.user_id == MOCK_USER_ID).delete()
    db.query(User).filter(User.id == MOCK_USER_ID).delete()
    db.commit()
    db.close()


@patch("app.api.learning.qdrant_client")
@patch("app.api.learning.completion")
def test_generate_and_fetch_study_materials(mock_completion, mock_qdrant, setup_and_teardown_db):
    db = setup_and_teardown_db

    # 1. Mock Qdrant scroll output
    mock_point = MagicMock()
    mock_point.payload = {"text": "Artificial Intelligence is a branch of computer science."}
    mock_qdrant.scroll.return_value = ([mock_point], None)

    # 2. Mock Gemini/LiteLLM completion response
    mock_choice = MagicMock()
    mock_choice.message.content = json_str = """{
        "flashcards": [
            {"front": "What is AI?", "back": "Artificial Intelligence"}
        ],
        "quizzes": [
            {
                "question": "What is AI stand for?",
                "options": ["Artificial Intelligence", "Action Intel", "Alternative Info", "Art Intel"],
                "correct_option": "A",
                "explanation": "AI represents Artificial Intelligence."
            }
        ],
        "mind_map": {
            "title": "Computer Science",
            "children": [{"title": "AI"}]
        }
    }"""
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_completion.return_value = mock_response

    # 3. Request generation
    r = client.post(f"/api/v1/learning/generate/{MOCK_DOC_ID}")
    assert r.status_code == 201
    assert r.json()["status"] == "success"

    # 4. Fetch flashcards
    r_cards = client.get(f"/api/v1/learning/flashcards?document_id={MOCK_DOC_ID}")
    assert r_cards.status_code == 200
    cards = r_cards.json()
    assert len(cards) == 1
    assert cards[0]["front"] == "What is AI?"
    assert cards[0]["box"] == 1

    # 5. Fetch quizzes
    r_quizzes = client.get(f"/api/v1/learning/quizzes?document_id={MOCK_DOC_ID}")
    assert r_quizzes.status_code == 200
    quizzes = r_quizzes.json()
    assert len(quizzes) == 1
    assert quizzes[0]["correct_option"] == "A"

    # 6. Fetch mind map
    r_map = client.get(f"/api/v1/learning/mindmap/{MOCK_DOC_ID}")
    assert r_map.status_code == 200
    m_map = r_map.json()
    assert m_map["structure"]["title"] == "Computer Science"


@patch("app.api.learning.qdrant_client")
@patch("app.api.learning.completion")
def test_spaced_repetition_leitner_system(mock_completion, mock_qdrant, setup_and_teardown_db):
    db = setup_and_teardown_db

    # 1. Generate study materials
    mock_point = MagicMock()
    mock_point.payload = {"text": "Artificial Intelligence details."}
    mock_qdrant.scroll.return_value = ([mock_point], None)

    mock_choice = MagicMock()
    mock_choice.message.content = """{
        "flashcards": [
            {"front": "Q1", "back": "A1"}
        ],
        "quizzes": [],
        "mind_map": {}
    }"""
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_completion.return_value = mock_response

    r = client.post(f"/api/v1/learning/generate/{MOCK_DOC_ID}")
    assert r.status_code == 201

    # Fetch card ID
    db.expire_all()
    card = db.query(Flashcard).filter(Flashcard.document_id == MOCK_DOC_ID).first()
    assert card is not None
    assert card.box == 1

    # 2. Review Correct -> Box moves to 2
    r_review = client.post(f"/api/v1/learning/flashcards/review/{card.id}", json={"correct": True})
    assert r_review.status_code == 200
    assert r_review.json()["box"] == 2

    # 3. Review Incorrect -> Box resets to 1
    r_review_reset = client.post(f"/api/v1/learning/flashcards/review/{card.id}", json={"correct": False})
    assert r_review_reset.status_code == 200
    assert r_review_reset.json()["box"] == 1
