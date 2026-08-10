from typing import List, Dict, Any, TypedDict
from sqlalchemy.orm import Session


class AgentState(TypedDict):
    """
    State representation passed between nodes in the LangGraph execution flow.
    """

    messages: List[Dict[str, Any]]
    user_id: int
    user_name: str
    db: Session
