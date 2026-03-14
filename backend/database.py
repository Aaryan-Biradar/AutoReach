from sqlalchemy import create_engine, Column, String, DateTime, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker
import os

Base = declarative_base()

# This represents one outreach call in your database
class Call(Base):
    __tablename__ = "calls"
    
    id = Column(String, primary_key=True)
    store_name = Column(String)           # e.g. "Loblaws Merivale"
    phone_number = Column(String)         
    called_at = Column(DateTime)          # when the call was made
    answered = Column(Boolean)            # did someone pick up?
    outcome = Column(String)              # "agreed", "callback", "rejected"
    pickup_scheduled = Column(Boolean)    
    notes = Column(String)                # anything interesting from the transcript

engine = create_engine(os.getenv("DATABASE_URL"))
Base.metadata.create_all(engine)