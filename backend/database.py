from uuid import uuid4
from datetime import datetime
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, String, DateTime, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/autoreach")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Call(Base):
    __tablename__ = "calls"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    store_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    called_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    answered = Column(Boolean, nullable=False, default=False)
    outcome = Column(String, nullable=False)
    pickup_scheduled = Column(Boolean, nullable=False, default=False)
    notes = Column(String, nullable=True)


def create_tables():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
