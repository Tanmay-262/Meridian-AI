import pytest
from app.database.session import engine
from app.models.base import Base

# Import all models to ensure they register on Base metadata before create_all
import app.models.user
import app.models.document
import app.models.memory
import app.models.planner
import app.models.learning


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """
    Creates all database tables in PostgreSQL before pytest execution,
    and drops them after all test modules complete.
    """
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
