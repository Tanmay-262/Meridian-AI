from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PlannerEventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    priority: Optional[str] = "medium"
    status: Optional[str] = "scheduled"


class PlannerEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    priority: Optional[str] = "medium"


class PlannerEventResponse(BaseModel):
    id: str
    user_id: int
    title: str
    description: Optional[str]
    start_time: datetime
    end_time: datetime
    priority: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
