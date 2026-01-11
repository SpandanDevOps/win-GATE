from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
from datetime import datetime
import os

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Samik19@localhost:5432/win_gate_db")

# Create engine and session
engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    study_hours = relationship("StudyHours", back_populates="user")
    curriculum_data = relationship("CurriculumData", back_populates="user")

class StudyHours(Base):
    __tablename__ = "study_hours"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Can be null for visitors
    visitor_id = Column(String, nullable=True)  # For non-authenticated users
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    day = Column(Integer, nullable=False)
    hours = Column(Float, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="study_hours")

class CurriculumData(Base):
    __tablename__ = "curriculum_data"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Can be null for visitors
    visitor_id = Column(String, nullable=True)  # For non-authenticated users
    subject = Column(String, nullable=False)
    topic = Column(Text, nullable=False)
    watched = Column(Boolean, default=False)
    revised = Column(Boolean, default=False)
    tested = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="curriculum_data")

class VisitorData(Base):
    __tablename__ = "visitor_data"
    
    id = Column(Integer, primary_key=True, index=True)
    visitor_id = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=func.now())
    last_activity = Column(DateTime, default=func.now(), onupdate=func.now())
    


# Create all tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
