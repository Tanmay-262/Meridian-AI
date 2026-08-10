from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.exceptions import UnexpectedResponse
from app.core.config import settings

# Initialize Qdrant client
# Communicates with Qdrant service inside the Docker Compose network
qdrant_client = QdrantClient(url=settings.QDRANT_URL)

COLLECTION_NAME = "meridian_documents"
VECTOR_SIZE = 384  # Matches sentence-transformers/all-MiniLM-L6-v2 dimension


def init_vector_db():
    """
    Initializes the Qdrant database collection if it doesn't already exist.
    Configured with Cosine Distance for semantic search compatibility.
    """
    try:
        # Check if the collection already exists
        exists = qdrant_client.collection_exists(collection_name=COLLECTION_NAME)
        if not exists:
            print(f"Initializing Qdrant collection: {COLLECTION_NAME}...")
            qdrant_client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=models.VectorParams(
                    size=VECTOR_SIZE, distance=models.Distance.COSINE
                ),
            )
            print(f"Collection {COLLECTION_NAME} created successfully.")
        else:
            print(f"Qdrant collection {COLLECTION_NAME} already exists.")
    except UnexpectedResponse as e:
        print(f"Failed to connect to Qdrant or create collection: {e}")
    except Exception as e:
        print(f"Unexpected error during Qdrant initialization: {e}")
