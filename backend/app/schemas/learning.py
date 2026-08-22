from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class FlashcardResponse(BaseModel):
    id: str
    user_id: int
    document_id: int
    front: str
    back: str
    box: int
    next_review: datetime

    class Config:
        from_attributes = True


class FlashcardReview(BaseModel):
    correct: bool


class QuizQuestionResponse(BaseModel):
    id: str
    user_id: int
    document_id: int
    question: str
    options: List[str]
    correct_option: str
    explanation: str

    class Config:
        from_attributes = True


class MindMapResponse(BaseModel):
    id: str
    user_id: int
    document_id: int
    structure: Dict[str, Any]

    class Config:
        from_attributes = True
