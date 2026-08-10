import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.chat import ChatThread, ChatMessage
from app.schemas.chat import (
    ChatThreadResponse,
    ChatThreadCreate,
    ChatMessageResponse,
    ChatMessageCreate,
)
from app.agent.graph import agent_graph

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/threads", response_model=ChatThreadResponse, status_code=status.HTTP_201_CREATED)
def create_thread(
    payload: ChatThreadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Creates a new conversation thread.
    """
    new_thread = ChatThread(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        title=payload.title or "New Chat",
    )
    db.add(new_thread)
    try:
        db.commit()
        db.refresh(new_thread)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create chat thread: {e}",
        )
    return new_thread


@router.get("/threads", response_model=List[ChatThreadResponse])
def list_threads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lists all chat threads for the current user, ordered by last updated.
    """
    threads = (
        db.query(ChatThread)
        .filter(ChatThread.user_id == current_user.id)
        .order_by(ChatThread.updated_at.desc())
        .all()
    )
    return threads


@router.get("/threads/{thread_id}/messages", response_model=List[ChatMessageResponse])
def get_messages(
    thread_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves the full message history for a specific thread.
    """
    thread = (
        db.query(ChatThread)
        .filter(ChatThread.id == thread_id, ChatThread.user_id == current_user.id)
        .first()
    )
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat thread not found or access denied.",
        )
    return thread.messages


@router.post("/threads/{thread_id}/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    thread_id: str,
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Appends a new user message, triggers the LangGraph agent reasoning cycle,
    saves the agent's response, and returns the reply.
    """
    # 1. Verify thread ownership
    thread = (
        db.query(ChatThread)
        .filter(ChatThread.id == thread_id, ChatThread.user_id == current_user.id)
        .first()
    )
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat thread not found or access denied.",
        )

    # 2. Save user message to database
    user_msg = ChatMessage(
        thread_id=thread_id,
        role="user",
        content=payload.content,
    )
    db.add(user_msg)
    
    # Update thread's updated_at timestamp to trigger sorting updates
    from datetime import datetime
    thread.updated_at = datetime.utcnow()
    
    try:
        db.commit()
        db.refresh(user_msg)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save user message: {e}",
        )

    # 3. Compile full message history into role/content dictionaries for LiteLLM/LangGraph
    history = []
    for msg in thread.messages:
        history.append({"role": msg.role, "content": msg.content})

    # 4. Prepare LangGraph State
    user_name = current_user.profile.full_name if current_user.profile else current_user.email.split("@")[0]
    initial_state = {
        "messages": history,
        "user_id": current_user.id,
        "user_name": user_name,
        "db": db,
    }

    # 5. Invoke LangGraph Reasoning Graph
    try:
        final_state = agent_graph.invoke(initial_state)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Agent reasoning failed: {e}",
        )

    # 6. Extract the final assistant reply from graph state output
    # LangGraph appends node outputs, so the final message is the last assistant reply
    agent_messages = final_state.get("messages", [])
    assistant_reply = None
    for msg in reversed(agent_messages):
        if msg.get("role") == "assistant" and msg.get("content"):
            assistant_reply = msg["content"]
            break

    if not assistant_reply:
        assistant_reply = "I completed reasoning but generated an empty response. Please try again."

    # 7. Save assistant reply to database
    assistant_msg = ChatMessage(
        thread_id=thread_id,
        role="assistant",
        content=assistant_reply,
    )
    db.add(assistant_msg)
    
    try:
        db.commit()
        db.refresh(assistant_msg)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save assistant response: {e}",
        )

    return assistant_msg
