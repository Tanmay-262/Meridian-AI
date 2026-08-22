import json
import uuid
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from litellm import completion

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.document import Document
from app.models.learning import Flashcard, QuizQuestion, MindMap
from app.schemas.learning import FlashcardResponse, FlashcardReview, QuizQuestionResponse, MindMapResponse
from app.database.vector_db import qdrant_client, COLLECTION_NAME
from qdrant_client.http import models as qdrant_models

router = APIRouter(prefix="/learning", tags=["learning"])


@router.post("/generate/{document_id}", status_code=status.HTTP_201_CREATED)
def generate_study_materials(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves document chunks from Qdrant, calls Gemini to compile
    flashcards, multiple-choice quizzes, and mind maps, and saves them to Postgres.
    """
    # 1. Verify document exists and belongs to user
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    # 2. Scroll and pull text chunks from Qdrant vector index
    try:
        scroll_result = qdrant_client.scroll(
            collection_name=COLLECTION_NAME,
            scroll_filter=qdrant_models.Filter(
                must=[
                    qdrant_models.FieldCondition(
                        key="document_id",
                        match=qdrant_models.MatchValue(value=document_id),
                    ),
                    qdrant_models.FieldCondition(
                        key="user_id",
                        match=qdrant_models.MatchValue(value=current_user.id),
                    ),
                ]
            ),
            limit=50,  # Fetch up to 50 text chunks to get balanced context
        )
        points, _ = scroll_result
        if not points:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No vector text chunks found for this document. Verify parsing completed.",
            )
        
        chunks = [p.payload["text"] for p in points if p.payload and "text" in p.payload]
        full_text = "\n\n".join(chunks)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve document context: {e}",
        )

    # 3. Call LLM to generate structured study materials
    model_name = "gemini/gemini-3.5-flash-lite"
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gemini API Key is not configured in backend settings.",
        )

    prompt = f"""You are an expert AI teacher. Analyze the following document text and generate:
1. A list of 5 study flashcards (front/back questions and concepts).
2. A list of 5 multiple-choice quiz questions. Each question must have exactly 4 choices (A, B, C, D), a correct option, and a short explanation.
3. A nested outline mind map of the core concepts (with title and child nodes).

Return your output as a single valid JSON object containing exactly these keys:
- "flashcards": a list of objects, each with "front" and "back" string fields.
- "quizzes": a list of objects, each with "question" (string), "options" (list of 4 strings), "correct_option" (string: "A", "B", "C", or "D"), and "explanation" (string) fields.
- "mind_map": a dictionary representing a hierarchical tree (e.g. {{"title": "Core Subject", "children": [{{"title": "Subtopic A", "children": []}}, {{"title": "Subtopic B", "children": []}}]}}).

Document text:
{full_text[:12000]}
"""

    try:
        response = completion(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            api_key=api_key,
            temperature=0.3,
            api_version="v1",
        )
        raw_content = response.choices[0].message.content
        
        # Strip code fences if returned by LLM
        if raw_content.startswith("```json"):
            raw_content = raw_content[7:]
        if raw_content.endswith("```"):
            raw_content = raw_content[:-3]
        
        study_data = json.loads(raw_content.strip())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI Study material generation failed: {e}",
        )

    # 4. Clean previous study materials for this document to avoid duplicates
    db.query(Flashcard).filter(
        Flashcard.document_id == document_id, Flashcard.user_id == current_user.id
    ).delete()
    db.query(QuizQuestion).filter(
        QuizQuestion.document_id == document_id, QuizQuestion.user_id == current_user.id
    ).delete()
    db.query(MindMap).filter(
        MindMap.document_id == document_id, MindMap.user_id == current_user.id
    ).delete()

    # 5. Insert newly generated materials
    try:
        # Insert Flashcards
        for card in study_data.get("flashcards", []):
            db.add(
                Flashcard(
                    id=str(uuid.uuid4()),
                    user_id=current_user.id,
                    document_id=document_id,
                    front=card.get("front", ""),
                    back=card.get("back", ""),
                    box=1,
                    next_review=datetime.utcnow(),
                )
            )

        # Insert Quizzes
        for q in study_data.get("quizzes", []):
            db.add(
                QuizQuestion(
                    id=str(uuid.uuid4()),
                    user_id=current_user.id,
                    document_id=document_id,
                    question=q.get("question", ""),
                    options=q.get("options", []),
                    correct_option=q.get("correct_option", "A"),
                    explanation=q.get("explanation", ""),
                )
            )

        # Insert MindMap
        db.add(
            MindMap(
                id=str(uuid.uuid4()),
                user_id=current_user.id,
                document_id=document_id,
                structure=study_data.get("mind_map", {}),
            )
        )

        db.commit()
        return {"status": "success", "message": "Study materials successfully generated!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store study materials in database: {e}",
        )


@router.get("/flashcards", response_model=List[FlashcardResponse])
def get_flashcards(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lists all flashcards associated with a specific document.
    """
    return (
        db.query(Flashcard)
        .filter(
            Flashcard.document_id == document_id,
            Flashcard.user_id == current_user.id,
        )
        .order_by(Flashcard.next_review.asc())
        .all()
    )


@router.post("/flashcards/review/{card_id}", response_model=FlashcardResponse)
def review_flashcard(
    card_id: str,
    review: FlashcardReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Applies the Leitner system logic:
    - Correct answer: advances card to the next box (up to Box 5). Reviews are spaced further out.
    - Incorrect answer: resets card back to Box 1. Reviews are scheduled immediately.
    """
    card = (
        db.query(Flashcard)
        .filter(Flashcard.id == card_id, Flashcard.user_id == current_user.id)
        .first()
    )
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flashcard not found.",
        )

    try:
        if review.correct:
            # Shift to next box (capped at 5)
            card.box = min(card.box + 1, 5)
        else:
            # Reset to box 1
            card.box = 1

        # Leitner spaced interval scaling: Box 1 (1 min), Box 2 (10 min), Box 3 (1 hour), Box 4 (1 day), Box 5 (5 days)
        intervals = {
            1: timedelta(minutes=1),
            2: timedelta(minutes=10),
            3: timedelta(hours=1),
            4: timedelta(days=1),
            5: timedelta(days=5),
        }
        card.next_review = datetime.utcnow() + intervals[card.box]
        
        db.commit()
        db.refresh(card)
        return card
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update review status: {e}",
        )


@router.get("/quizzes", response_model=List[QuizQuestionResponse])
def get_quizzes(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves all generated multiple-choice quiz questions for a document.
    """
    return (
        db.query(QuizQuestion)
        .filter(
            QuizQuestion.document_id == document_id,
            QuizQuestion.user_id == current_user.id,
        )
        .all()
    )


@router.get("/mindmap/{document_id}", response_model=MindMapResponse)
def get_mindmap(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves the parsed outline mind map hierarchy tree.
    """
    mindmap = (
        db.query(MindMap)
        .filter(
            MindMap.document_id == document_id,
            MindMap.user_id == current_user.id,
        )
        .first()
    )
    if not mindmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mind map outline not found. Click generate to create study assets.",
        )
    return mindmap
