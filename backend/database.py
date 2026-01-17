from sqlmodel import SQLModel, create_engine, Session
import os

# SQLite database file
DATABASE_URL = "sqlite:///./pulsecity.db"

# Create engine
engine = create_engine(DATABASE_URL, echo=False)


def init_db():
    """Create all tables."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Get database session."""
    with Session(engine) as session:
        yield session
