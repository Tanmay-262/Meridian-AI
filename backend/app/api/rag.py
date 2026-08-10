from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from qdrant_client.http import models as qdrant_models

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.rag import RAGSearchResult
from app.database.vector_db import qdrant_client, COLLECTION_NAME
from app.rag.embeddings import embeddings_encoder

router = APIRouter(prefix="/rag", tags=["rag"])


@router.get("/search", response_model=List[RAGSearchResult])
def semantic_search(
    q: str = Query(..., min_length=1, description="Natural language search query"),
    limit: int = Query(5, ge=1, le=20, description="Max search results to retrieve"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Performs a semantic similarity search across the current user's uploaded documents.
    Generates a query embedding with PyTorch, runs a vector search in Qdrant with
    metadata filters, and retrieves document filenames from PostgreSQL.
    """
    # 1. Embed search query
    try:
        query_vector = embeddings_encoder.embed_query(q)
        if not query_vector:
            raise ValueError("Failed to generate embedding vector for query.")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query embedding generation failed: {e}",
        )

    # 2. Search Qdrant vector database (scoped strictly to current user's documents)
    try:
        search_results = qdrant_client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_vector,
            query_filter=qdrant_models.Filter(
                must=[
                    qdrant_models.FieldCondition(
                        key="user_id",
                        match=qdrant_models.MatchValue(value=current_user.id),
                    )
                ]
            ),
            limit=limit,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vector search execution failed: {e}",
        )

    if not search_results:
        return []

    # 3. Extract unique document IDs and retrieve filenames from Postgres
    doc_ids = list({res.payload["document_id"] for res in search_results if res.payload})
    
    doc_map = {}
    if doc_ids:
        docs = db.query(Document).filter(Document.id.in_(doc_ids)).all()
        doc_map = {doc.id: doc.filename for doc in docs}

    # 4. Construct response list with scores and citations
    formatted_results = []
    for res in search_results:
        if not res.payload:
            continue
        
        doc_id = res.payload["document_id"]
        filename = doc_map.get(doc_id, "Unknown Document")
        
        formatted_results.append(
            RAGSearchResult(
                text=res.payload["text"],
                score=res.score,
                document_id=doc_id,
                filename=filename,
            )
        )

    return formatted_results
