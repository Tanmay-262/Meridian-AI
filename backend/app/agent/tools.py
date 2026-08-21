import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from qdrant_client.http import models as qdrant_models

from app.database.vector_db import qdrant_client, COLLECTION_NAME
from app.rag.embeddings import embeddings_encoder
from app.models.memory import LongTermMemory
from app.models.planner import PlannerEvent


def search_knowledge_hub(query: str, user_id: int, db: Session) -> str:
    """
    Semantic search across the user's uploaded PDF and DOCX files.
    Use this tool to find facts, definitions, or references inside the uploaded documents.
    """
    try:
        # Embed query text
        query_vector = embeddings_encoder.embed_query(query)

        # Search Qdrant vector database (scoped to user)
        results = qdrant_client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_vector,
            query_filter=qdrant_models.Filter(
                must=[
                    qdrant_models.FieldCondition(
                        key="user_id",
                        match=qdrant_models.MatchValue(value=user_id),
                    )
                ]
            ),
            limit=3,
        )

        if not results:
            return "No matching document segments found in Knowledge Hub."

        # Format context
        contexts = []
        for i, res in enumerate(results):
            contexts.append(f"[Source: Result {i+1}] {res.payload['text']}")

        return "\n\n".join(contexts)
    except Exception as e:
        return f"Error executing document RAG search: {e}"


def get_long_term_memories(user_id: int, db: Session) -> str:
    """
    Retrieves all learned facts and memories about the user from the relational database.
    """
    try:
        memories = (
            db.query(LongTermMemory)
            .filter(LongTermMemory.user_id == user_id)
            .all()
        )
        if not memories:
            return "No stored memories found for this user."

        mem_list = [f"- {m.key}: {m.value}" for m in memories]
        return "\n".join(mem_list)
    except Exception as e:
        return f"Error loading long term memories: {e}"


def save_long_term_memory(key: str, value: str, user_id: int, db: Session) -> str:
    """
    Saves or updates a specific fact about the user (e.g. key: 'job', value: 'Software Engineer')
    in the database to persist across future chat sessions.
    """
    try:
        # Check if memory key already exists for user
        memory = (
            db.query(LongTermMemory)
            .filter(LongTermMemory.user_id == user_id, LongTermMemory.key == key)
            .first()
        )

        if memory:
            memory.value = value
        else:
            memory = LongTermMemory(user_id=user_id, key=key, value=value)
            db.add(memory)

        db.commit()
        return f"Memory successfully saved: {key} = {value}"
    except Exception as e:
        db.rollback()
        return f"Error storing long term memory: {e}"


def get_scheduled_events(user_id: int, db: Session) -> str:
    """
    Retrieves all scheduled calendar events and tasks.
    Use this to show the user their current schedule.
    """
    try:
        events = (
            db.query(PlannerEvent)
            .filter(PlannerEvent.user_id == user_id, PlannerEvent.status == "scheduled")
            .order_by(PlannerEvent.start_time.asc())
            .all()
        )
        if not events:
            return "Your calendar is currently empty."

        lines = []
        for ev in events:
            lines.append(
                f"- [{ev.priority.upper()}] '{ev.title}': {ev.start_time.strftime('%Y-%m-%d %H:%M')} to {ev.end_time.strftime('%H:%M')} (Status: {ev.status})"
            )
        return "Active Schedule:\n" + "\n".join(lines)
    except Exception as e:
        return f"Error fetching scheduled events: {e}"


def schedule_event(
    title: str,
    start_time: str,
    end_time: str,
    priority: str,
    user_id: int,
    db: Session,
    description: str = None,
) -> str:
    """
    Saves a new task/event in the calendar.
    Parameters 'start_time' and 'end_time' must be ISO-format date strings (e.g. 'YYYY-MM-DDTHH:MM:SS').
    Priority must be 'high', 'medium', or 'low'.
    """
    try:
        # Parse dates robustly
        s_dt = datetime.fromisoformat(start_time.replace(" ", "T"))
        e_dt = datetime.fromisoformat(end_time.replace(" ", "T"))

        # Create new event
        new_event = PlannerEvent(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=title,
            description=description,
            start_time=s_dt,
            end_time=e_dt,
            priority=priority.lower() if priority else "medium",
            status="scheduled",
        )
        db.add(new_event)
        db.commit()

        # Check for overlaps immediately
        overlaps = (
            db.query(PlannerEvent)
            .filter(
                PlannerEvent.user_id == user_id,
                PlannerEvent.status == "scheduled",
                PlannerEvent.id != new_event.id,
                PlannerEvent.start_time < e_dt,
                PlannerEvent.end_time > s_dt,
            )
            .all()
        )

        overlap_msg = ""
        if overlaps:
            overlap_titles = ", ".join([f"'{o.title}'" for o in overlaps])
            overlap_msg = f" WARNING: This event overlaps with existing schedules: {overlap_titles}. You can ask me to resolve conflicts if needed."

        return f"Event '{title}' scheduled successfully from {s_dt.strftime('%Y-%m-%d %H:%M')} to {e_dt.strftime('%H:%M')}.{overlap_msg}"
    except Exception as e:
        db.rollback()
        return f"Error scheduling event: {e}"


def auto_resolve_schedule_conflicts(user_id: int, db: Session) -> str:
    """
    Detects overlaps in the calendar and automatically reschedules lower-priority tasks
    to clear any conflicts, prioritizing 'high' > 'medium' > 'low'.
    """
    try:
        resolved_logs = []
        max_iterations = 10
        iteration = 0
        has_conflicts = True

        while has_conflicts and iteration < max_iterations:
            has_conflicts = False
            iteration += 1
            # Fetch all scheduled events ordered by start_time
            events = (
                db.query(PlannerEvent)
                .filter(PlannerEvent.user_id == user_id, PlannerEvent.status == "scheduled")
                .order_by(PlannerEvent.start_time.asc())
                .all()
            )

            for i in range(len(events)):
                for j in range(i + 1, len(events)):
                    ev1 = events[i]
                    ev2 = events[j]

                    # Check overlap (ev1 starts before ev2 ends, ev1 ends after ev2 starts)
                    if ev1.start_time < ev2.end_time and ev1.end_time > ev2.start_time:
                        has_conflicts = True
                        # Map priority weights
                        priority_map = {"high": 3, "medium": 2, "low": 1}
                        p1 = priority_map.get(ev1.priority.lower(), 2)
                        p2 = priority_map.get(ev2.priority.lower(), 2)

                        if p1 >= p2:
                            # ev2 is lower or equal, reschedule ev2 to start after ev1
                            duration = ev2.end_time - ev2.start_time
                            old_start = ev2.start_time
                            ev2.start_time = ev1.end_time
                            ev2.end_time = ev1.end_time + duration
                            resolved_logs.append(
                                f"Rescheduled '{ev2.title}' (priority: {ev2.priority}) from {old_start.strftime('%H:%M')} to {ev2.start_time.strftime('%H:%M')} due to conflict with higher-priority '{ev1.title}'."
                            )
                        else:
                            # ev1 is lower, reschedule ev1 to start after ev2
                            duration = ev1.end_time - ev1.start_time
                            old_start = ev1.start_time
                            ev1.start_time = ev2.end_time
                            ev1.end_time = ev2.end_time + duration
                            resolved_logs.append(
                                f"Rescheduled '{ev1.title}' (priority: {ev1.priority}) from {old_start.strftime('%H:%M')} to {ev1.start_time.strftime('%H:%M')} due to conflict with higher-priority '{ev2.title}'."
                            )

                        db.commit()
                        break
                if has_conflicts:
                    break

        if not resolved_logs:
            return "No scheduling conflicts detected in your calendar."

        return "Conflict Resolution complete:\n" + "\n".join(resolved_logs)
    except Exception as e:
        db.rollback()
        return f"Error resolving conflicts: {e}"



# LiteLLM tools specification schemas (matches OpenAI standard json format)
AGENT_TOOLS_SPEC = [
    {
        "type": "function",
        "function": {
            "name": "search_knowledge_hub",
            "description": "Searches and retrieves relevant text passages from the user's uploaded PDF/Word documents. Use this when the user asks a question about their files, books, or documentation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Natural language query to search documents for.",
                    }
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_long_term_memories",
            "description": "Loads all persistent facts known about the user (like hobbies, job, preferences). Use this at the start of a conversation to refresh profile context.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "save_long_term_memory",
            "description": "Saves a new fact about the user to remember in future chat sessions. Use this when the user shares something personal (e.g. 'I work as a designer' or 'I prefer dark theme').",
            "parameters": {
                "type": "object",
                "properties": {
                    "key": {
                        "type": "string",
                        "description": "Short snake_case descriptor key (e.g. 'occupation', 'pet_name').",
                    },
                    "value": {
                        "type": "string",
                        "description": "The fact or detail to store.",
                    },
                },
                "required": ["key", "value"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_scheduled_events",
            "description": "Loads all scheduled calendar events and tasks currently active in the user's planner.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "schedule_event",
            "description": "Schedules a new task or event in the user's planner calendar.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "The title/name of the event.",
                    },
                    "start_time": {
                        "type": "string",
                        "description": "ISO-format start date-time string (e.g., '2026-08-22T14:00:00').",
                    },
                    "end_time": {
                        "type": "string",
                        "description": "ISO-format end date-time string (e.g., '2026-08-22T15:30:00').",
                    },
                    "priority": {
                        "type": "string",
                        "description": "Event priority weight: 'high', 'medium', or 'low'.",
                        "enum": ["high", "medium", "low"],
                    },
                    "description": {
                        "type": "string",
                        "description": "Optional notes or details about the event.",
                    },
                },
                "required": ["title", "start_time", "end_time", "priority"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "auto_resolve_schedule_conflicts",
            "description": "Checks the calendar for overlapping schedules and reschedules lower-priority tasks to resolve all conflicts.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
]
