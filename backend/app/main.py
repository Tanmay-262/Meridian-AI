from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.rag import router as rag_router
from app.api.chat import router as chat_router
from app.api.planner import router as planner_router
from app.database.vector_db import init_vector_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run startup actions
    init_vector_db()
    yield
    # Run shutdown actions (none needed currently)


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Meridian Personal OS",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS setup
# In production, this should be restricted to actual domains.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(documents_router, prefix="/api/v1")
app.include_router(rag_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(planner_router, prefix="/api/v1")



@app.get("/health")
@app.get("/api/v1/health")
async def health_check():
    """
    Health check endpoint to verify API server is up and responsive.
    """
    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME,
        "environment": settings.ENV,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
