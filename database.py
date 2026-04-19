from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///./chores.db"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}, 
    echo=False
)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session





''' #previous code
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./chores.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
'''
