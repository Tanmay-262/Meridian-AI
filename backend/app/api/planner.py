import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.planner import PlannerEvent
from app.schemas.planner import PlannerEventCreate, PlannerEventResponse
from app.agent.tools import auto_resolve_schedule_conflicts

router = APIRouter(prefix="/planner", tags=["planner"])


@router.post("/events", response_model=PlannerEventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: PlannerEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Creates and schedules a new calendar event for the authenticated user.
    """
    try:
        new_event = PlannerEvent(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            title=event_in.title,
            description=event_in.description,
            start_time=event_in.start_time,
            end_time=event_in.end_time,
            priority=event_in.priority or "medium",
            status="scheduled",
        )
        db.add(new_event)
        db.commit()
        db.refresh(new_event)
        return new_event
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create event: {e}",
        )


@router.get("/events", response_model=List[PlannerEventResponse])
def list_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lists all active scheduled events for the current user.
    """
    try:
        events = (
            db.query(PlannerEvent)
            .filter(
                PlannerEvent.user_id == current_user.id,
                PlannerEvent.status == "scheduled",
            )
            .order_by(PlannerEvent.start_time.asc())
            .all()
        )
        return events
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list events: {e}",
        )


@router.post("/resolve")
def resolve_conflicts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Runs the automated conflict resolution algorithm to reschedule overlapping tasks based on priority.
    """
    result = auto_resolve_schedule_conflicts(user_id=current_user.id, db=db)
    return {"message": result}


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deletes/cancels a scheduled event.
    """
    event = (
        db.query(PlannerEvent)
        .filter(
            PlannerEvent.id == event_id,
            PlannerEvent.user_id == current_user.id,
        )
        .first()
    )
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )
    try:
        # Soft delete or hard delete; let's hard delete for simplicity in timeline updates
        db.delete(event)
        db.commit()
        return
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete event: {e}",
        )
