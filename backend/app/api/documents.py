import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.document import Document, DocumentTag
from app.schemas.document import DocumentResponse
from app.utils.parser import extract_text_from_file
from app.database.session import SessionLocal

# Qdrant vector database and PyTorch models
from qdrant_client.http import models as qdrant_models
from app.database.vector_db import qdrant_client, COLLECTION_NAME
from app.rag.embeddings import embeddings_encoder
from app.rag.splitter import RecursiveCharacterTextSplitter

router = APIRouter(prefix="/documents", tags=["documents"])

# Root uploads directory inside container
UPLOAD_DIR = "/app/uploads"
# 10 MB limit
MAX_FILE_SIZE = 10 * 1024 * 1024


def process_document_task(document_id: int, file_path: str):
    """
    Background task to parse the uploaded document, chunk the text recursively,
    generate semantic vector embeddings using PyTorch, and index them in Qdrant.
    """
    # Create a fresh database session for background threads
    db = SessionLocal()
    try:
        # Fetch document to get user context
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return
        user_id = doc.user_id

        # 1. Parse raw text page/paragraph boundaries
        text = extract_text_from_file(file_path)
        if not text.strip():
            raise ValueError("Document contains no readable text.")

        # 2. Chunk text recursively
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
        chunks = splitter.split_text(text)

        # 3. Generate PyTorch sentence-transformer embeddings
        embeddings = embeddings_encoder.embed_texts(chunks)

        # 4. Construct vector points for Qdrant
        points = []
        for i, (chunk, vector) in enumerate(zip(chunks, embeddings)):
            point_id = str(uuid.uuid4())
            points.append(
                qdrant_models.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={
                        "document_id": document_id,
                        "user_id": user_id,
                        "text": chunk,
                        "chunk_index": i,
                    },
                )
            )

        # 5. Index chunks in Qdrant
        if points:
            qdrant_client.upsert(
                collection_name=COLLECTION_NAME,
                wait=True,
                points=points,
            )

        # Update SQL status
        doc.status = "completed"
        db.commit()
    except Exception as e:
        print(f"Background parsing failed for document {document_id}: {e}")
        db.rollback()
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "failed"
            db.commit()
    finally:
        db.close()


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    tags_raw: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Uploads a PDF or DOCX file, writes it to disk in user-isolated directories,
    registers metadata in database, and schedules a background text extraction.
    """
    # 1. Validate File Format
    filename = file.filename
    _, ext = os.path.splitext(filename.lower())
    if ext not in [".pdf", ".docx", ".doc"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Only PDF and DOCX documents are allowed.",
        )

    # 2. Validate File Size (streaming check)
    # Read chunk by chunk to verify size before writing to keep memory light
    file_size = 0
    contents = await file.read(1024)
    file_size += len(contents)
    while contents:
        contents = await file.read(1024 * 1024)  # Read 1MB chunk
        file_size += len(contents)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum upload size of {MAX_FILE_SIZE // (1024 * 1024)}MB.",
            )

    # Reset file cursor after reading
    await file.seek(0)

    # 3. Create User Directory
    user_upload_dir = os.path.join(UPLOAD_DIR, str(current_user.id))
    os.makedirs(user_upload_dir, exist_ok=True)

    # 4. Generate Unique Filename to prevent host overrides
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(user_upload_dir, unique_filename)

    # 5. Write File Stream to Disk
    try:
        with open(file_path, "wb") as f:
            while True:
                chunk = await file.read(1024 * 64)  # 64KB chunks
                if not chunk:
                    break
                f.write(chunk)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write file to storage disk: {e}",
        )

    # 6. Save metadata record to DB
    new_doc = Document(
        user_id=current_user.id,
        filename=filename,
        file_path=file_path,
        file_size=file_size,
        status="processing",
    )
    db.add(new_doc)
    db.flush()  # Generate new_doc.id

    # 7. Add tags if provided
    if tags_raw:
        # Split by comma, strip spaces, and filter empty strings
        tags_list = [t.strip() for t in tags_raw.split(",") if t.strip()]
        for tag_name in tags_list:
            new_tag = DocumentTag(document_id=new_doc.id, name=tag_name)
            db.add(new_tag)

    try:
        db.commit()
        db.refresh(new_doc)
    except Exception as e:
        db.rollback()
        # Clean up written file if DB register fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register document metadata in database.",
        )

    # 8. Schedule Background Text Parsing
    background_tasks.add_task(process_document_task, new_doc.id, file_path)

    return new_doc


@router.get("/", response_model=List[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lists all documents uploaded by the active authenticated user.
    """
    documents = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return documents


@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deletes the document metadata from the database, cascadingly removes tags,
    and deletes the raw file from the container storage disk.
    """
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )

    file_path = doc.file_path

    # 1. Delete vector points from Qdrant vector store
    try:
        qdrant_client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=qdrant_models.Filter(
                must=[
                    qdrant_models.FieldCondition(
                        key="document_id",
                        match=qdrant_models.MatchValue(value=document_id),
                    )
                ]
            ),
        )
    except Exception as e:
        print(f"Failed to delete Qdrant vectors for document {document_id}: {e}")

    # 2. Delete metadata records from relational database
    db.delete(doc)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document metadata from database.",
        )

    # 3. Clean up physical file on disk
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Failed to delete file from disk at {file_path}: {e}")

    return {"detail": "Document successfully deleted."}
