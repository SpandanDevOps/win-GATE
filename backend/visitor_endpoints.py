from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import os

# Import our database models and dependencies
from database_models import get_db, User, StudyHours, CurriculumData, VisitorData
from utils import pwd_context, SECRET_KEY, ALGORITHM, create_access_token, verify_token

# Create router for visitor endpoints
visitor_router = APIRouter(prefix="/api/visitor", tags=["Visitor"])

# Pydantic models for request/response
from pydantic import BaseModel

class VisitorRegister(BaseModel):
    visitor_id: str

class VisitorResponse(BaseModel):
    id: int
    visitor_id: str
    created_at: datetime
    last_activity: datetime

class VisitorDataResponse(BaseModel):
    visitor_id: str
    study_hours: List[dict]
    curriculum_data: List[dict]
    total_study_hours: float
    total_topics: int
    completed_topics: int

# Visitor endpoints (for non-authenticated users)

@visitor_router.post("/register")
async def register_visitor(
    visitor_data: VisitorRegister,
    db: Session = Depends(get_db)
):
    """Register a new visitor"""
    
    # Check if visitor already exists
    existing_visitor = db.query(VisitorData).filter(
        VisitorData.visitor_id == visitor_data.visitor_id
    ).first()
    
    if existing_visitor:
        # Update last activity
        existing_visitor.last_activity = datetime.utcnow()
        db.commit()
        
        return {
            "message": "Visitor already registered, updated last activity",
            "visitor_id": existing_visitor.visitor_id,
            "created_at": existing_visitor.created_at
        }
    else:
        # Create new visitor record
        new_visitor = VisitorData(
            visitor_id=visitor_data.visitor_id
        )
        
        db.add(new_visitor)
        db.commit()
        db.refresh(new_visitor)
        
        return {
            "message": "Visitor registered successfully",
            "visitor_id": new_visitor.visitor_id,
            "created_at": new_visitor.created_at
        }

@visitor_router.get("/data/{visitor_id}", response_model=VisitorDataResponse)
async def get_visitor_all_data(
    visitor_id: str,
    db: Session = Depends(get_db)
):
    """Get all data for a visitor (study hours + curriculum)"""
    
    # Check if visitor exists
    visitor = db.query(VisitorData).filter(
        VisitorData.visitor_id == visitor_id
    ).first()
    
    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found"
        )
    
    # Get study hours data
    study_hours_records = db.query(StudyHours).filter(
        StudyHours.visitor_id == visitor_id
    ).all()
    
    study_hours_data = [
        {
            "id": record.id,
            "month": record.month,
            "year": record.year,
            "day": record.day,
            "hours": record.hours,
            "created_at": record.created_at,
            "updated_at": record.updated_at
        }
        for record in study_hours_records
    ]
    
    # Get curriculum data
    curriculum_records = db.query(CurriculumData).filter(
        CurriculumData.visitor_id == visitor_id
    ).all()
    
    curriculum_data = [
        {
            "id": record.id,
            "subject": record.subject,
            "topic": record.topic,
            "watched": record.watched,
            "revised": record.revised,
            "tested": record.tested,
            "created_at": record.created_at,
            "updated_at": record.updated_at
        }
        for record in curriculum_records
    ]
    
    # Calculate statistics
    total_study_hours = sum(record.hours for record in study_hours_records)
    total_topics = len(curriculum_records)
    completed_topics = sum(1 for record in curriculum_records if record.tested)
    
    return VisitorDataResponse(
        visitor_id=visitor_id,
        study_hours=study_hours_data,
        curriculum_data=curriculum_data,
        total_study_hours=total_study_hours,
        total_topics=total_topics,
        completed_topics=completed_topics
    )

@visitor_router.delete("/data/{visitor_id}")
async def delete_visitor_all_data(
    visitor_id: str,
    db: Session = Depends(get_db)
):
    """Delete all data for a visitor"""
    
    # Check if visitor exists
    visitor = db.query(VisitorData).filter(
        VisitorData.visitor_id == visitor_id
    ).first()
    
    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found"
        )
    
    # Delete all study hours for this visitor
    study_hours_deleted = db.query(StudyHours).filter(
        StudyHours.visitor_id == visitor_id
    ).delete(synchronize_session=False)
    
    # Delete all curriculum data for this visitor
    curriculum_deleted = db.query(CurriculumData).filter(
        CurriculumData.visitor_id == visitor_id
    ).delete(synchronize_session=False)
    
    # Delete visitor record
    visitor_deleted = db.query(VisitorData).filter(
        VisitorData.visitor_id == visitor_id
    ).delete(synchronize_session=False)
    
    db.commit()
    
    return {
        "message": "All visitor data deleted successfully",
        "deleted_study_hours": study_hours_deleted,
        "deleted_curriculum": curriculum_deleted,
        "deleted_visitor": visitor_deleted
    }

@visitor_router.get("/study-hours/{visitor_id}/{month}/{year}")
async def get_visitor_study_hours(
    visitor_id: str,
    month: int,
    year: int,
    db: Session = Depends(get_db)
):
    """Get study hours for a specific month and year for visitor"""
    
    # Check if visitor exists
    visitor = db.query(VisitorData).filter(
        VisitorData.visitor_id == visitor_id
    ).first()
    
    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found"
        )
    
    # Get study hours for the month
    study_records = db.query(StudyHours).filter(
        StudyHours.visitor_id == visitor_id,
        StudyHours.month == month,
        StudyHours.year == year
    ).all()
    
    # Convert to response format
    response_data = [
        {
            "id": record.id,
            "month": record.month,
            "year": record.year,
            "day": record.day,
            "hours": record.hours,
            "created_at": record.created_at,
            "updated_at": record.updated_at
        }
        for record in study_records
    ]
    
    return {
        "visitor_id": visitor_id,
        "month": month,
        "year": year,
        "data": response_data,
        "total_hours": sum(record.hours for record in study_records)
    }

@visitor_router.get("/curriculum/{visitor_id}")
async def get_visitor_curriculum(
    visitor_id: str,
    db: Session = Depends(get_db)
):
    """Get curriculum data for visitor"""
    
    # Check if visitor exists
    visitor = db.query(VisitorData).filter(
        VisitorData.visitor_id == visitor_id
    ).first()
    
    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found"
        )
    
    # Get curriculum records
    curriculum_records = db.query(CurriculumData).filter(
        CurriculumData.visitor_id == visitor_id
    ).all()
    
    # Convert to response format
    response_data = [
        {
            "id": record.id,
            "subject": record.subject,
            "topic": record.topic,
            "watched": record.watched,
            "revised": record.revised,
            "tested": record.tested,
            "created_at": record.created_at,
            "updated_at": record.updated_at
        }
        for record in curriculum_records
    ]
    
    return {
        "visitor_id": visitor_id,
        "data": response_data,
        "total_topics": len(curriculum_records),
        "completed_topics": sum(1 for record in curriculum_records if record.tested)
    }

@visitor_router.post("/study-hours/save")
async def save_visitor_study_hours(
    visitor_id: str,
    month: int,
    year: int,
    day: int,
    hours: float,
    db: Session = Depends(get_db)
):
    """Save study hours for visitor"""
    
    # Check if visitor exists
    visitor = db.query(VisitorData).filter(
        VisitorData.visitor_id == visitor_id
    ).first()
    
    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found"
        )
    
    # Check if study hours already exist for this day
    existing_record = db.query(StudyHours).filter(
        StudyHours.visitor_id == visitor_id,
        StudyHours.month == month,
        StudyHours.year == year,
        StudyHours.day == day
    ).first()
    
    if existing_record:
        # Update existing record
        existing_record.hours = hours
        existing_record.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_record)
        
        return {
            "message": "Study hours updated successfully",
            "id": existing_record.id,
            "hours": existing_record.hours
        }
    else:
        # Create new record
        new_record = StudyHours(
            visitor_id=visitor_id,
            month=month,
            year=year,
            day=day,
            hours=hours
        )
        
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        
        return {
            "message": "Study hours saved successfully",
            "id": new_record.id,
            "hours": new_record.hours
        }

@visitor_router.post("/curriculum/save")
async def save_visitor_curriculum_topic(
    visitor_id: str,
    subject: str,
    topic: str,
    watched: bool = False,
    revised: bool = False,
    tested: bool = False,
    db: Session = Depends(get_db)
):
    """Save curriculum topic for visitor"""
    
    # Check if visitor exists
    visitor = db.query(VisitorData).filter(
        VisitorData.visitor_id == visitor_id
    ).first()
    
    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found"
        )
    
    # Check if curriculum topic already exists
    existing_record = db.query(CurriculumData).filter(
        CurriculumData.visitor_id == visitor_id,
        CurriculumData.subject == subject,
        CurriculumData.topic == topic
    ).first()
    
    if existing_record:
        # Update existing record
        existing_record.watched = watched
        existing_record.revised = revised
        existing_record.tested = tested
        existing_record.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_record)
        
        return {
            "message": "Curriculum topic updated successfully",
            "id": existing_record.id,
            "subject": existing_record.subject,
            "topic": existing_record.topic
        }
    else:
        # Create new record
        new_record = CurriculumData(
            visitor_id=visitor_id,
            subject=subject,
            topic=topic,
            watched=watched,
            revised=revised,
            tested=tested
        )
        
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        
        return {
            "message": "Curriculum topic saved successfully",
            "id": new_record.id,
            "subject": new_record.subject,
            "topic": new_record.topic
        }
