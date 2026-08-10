from pydantic import BaseModel


class RAGSearchResult(BaseModel):
    text: str
    score: float
    document_id: int
    filename: str
