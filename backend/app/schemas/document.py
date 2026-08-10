from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class DocumentTagResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class DocumentResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    file_size: int
    status: str
    created_at: datetime
    updated_at: datetime
    tags: List[DocumentTagResponse]

    class Config:
        from_attributes = True
