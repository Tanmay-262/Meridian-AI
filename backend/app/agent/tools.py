from sqlalchemy.orm import Session
from qdrant_client.http import models as qdrant_models

from app.database.vector_db import qdrant_client, COLLECTION_NAME
from app.rag.embeddings import embeddings_encoder
from app.models.memory import LongTermMemory


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
]
