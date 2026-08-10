from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class ChatMessageResponse(BaseModel):
    id: int
    thread_id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatThreadResponse(BaseModel):
    id: str
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse]

    class Config:
        from_attributes = True


class ChatThreadCreate(BaseModel):
    title: Optional[str] = "New Chat"


class ChatMessageCreate(BaseModel):
    content: str
