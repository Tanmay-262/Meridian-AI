# Import all models here so that Alembic's target_metadata can discover them.
# If a model is not imported here, Alembic auto-generations will ignore them.

from app.models.base import Base
from app.models.user import User, Profile
from app.models.document import Document, DocumentTag
from app.models.chat import ChatThread, ChatMessage
from app.models.memory import LongTermMemory
from app.models.planner import PlannerEvent
from app.models.learning import Flashcard, QuizQuestion, MindMap

__all__ = [
    "Base",
    "User",
    "Profile",
    "Document",
    "DocumentTag",
    "ChatThread",
    "ChatMessage",
    "LongTermMemory",
    "PlannerEvent",
    "Flashcard",
    "QuizQuestion",
    "MindMap",
]
