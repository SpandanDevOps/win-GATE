from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import os

# Import our database models and dependencies
from database_models import get_db, User, StudyHours, CurriculumData, VisitorData
from utils import pwd_context, SECRET_KEY, ALGORITHM, create_access_token, verify_token

# Create router for curriculum endpoints
curriculum_router = APIRouter(prefix="/api/curriculum", tags=["Curriculum"])

# Pydantic models for request/response
from pydantic import BaseModel

class CurriculumTopicCreate(BaseModel):
    subject: str
    topic: str
    watched: bool = False
    revised: bool = False
    tested: bool = False

class CurriculumTopicResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    visitor_id: Optional[str] = None
    subject: str
    topic: str
    watched: bool
    revised: bool
    tested: bool
    created_at: datetime
    updated_at: datetime

class CurriculumSubjectResponse(BaseModel):
    subject: str
    topics: List[CurriculumTopicResponse]
    watched_count: int
    revised_count: int
    tested_count: int
    total_topics: int

class CurriculumStatsResponse(BaseModel):
    total_topics: int
    watched_topics: int
    revised_topics: int
    tested_topics: int
    overall_progress: float
    subjects: List[CurriculumSubjectResponse]

# Authentication dependency for user endpoints
def get_current_user_email(current_user_email: str = Depends(verify_token)):
    return current_user_email

# Curriculum endpoints for authenticated users

@curriculum_router.post("/save", response_model=CurriculumTopicResponse)
async def save_curriculum_topic(
    topic_data: CurriculumTopicCreate,
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
):
    """Save curriculum topic for authenticated user"""
    
    # Get current user
    user = db.query(User).filter(User.email == current_user_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if curriculum topic already exists
    existing_record = db.query(CurriculumData).filter(
        CurriculumData.user_id == user.id,
        CurriculumData.subject == topic_data.subject,
        CurriculumData.topic == topic_data.topic
    ).first()
    
    if existing_record:
        # Update existing record
        existing_record.watched = topic_data.watched
        existing_record.revised = topic_data.revised
        existing_record.tested = topic_data.tested
        existing_record.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_record)
        
        return CurriculumTopicResponse(
            id=existing_record.id,
            user_id=existing_record.user_id,
            subject=existing_record.subject,
            topic=existing_record.topic,
            watched=existing_record.watched,
            revised=existing_record.revised,
            tested=existing_record.tested,
            created_at=existing_record.created_at,
            updated_at=existing_record.updated_at
        )
    else:
        # Create new record
        new_record = CurriculumData(
            user_id=user.id,
            subject=topic_data.subject,
            topic=topic_data.topic,
            watched=topic_data.watched,
            revised=topic_data.revised,
            tested=topic_data.tested
        )
        
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        
        return CurriculumTopicResponse(
            id=new_record.id,
            user_id=new_record.user_id,
            subject=new_record.subject,
            topic=new_record.topic,
            watched=new_record.watched,
            revised=new_record.revised,
            tested=new_record.tested,
            created_at=new_record.created_at,
            updated_at=new_record.updated_at
        )

@curriculum_router.get("/all", response_model=CurriculumStatsResponse)
async def get_all_curriculum_data(
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
):
    """Get all curriculum data with statistics for authenticated user"""
    
    # Get current user
    user = db.query(User).filter(User.email == current_user_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get all curriculum records
    curriculum_records = db.query(CurriculumData).filter(
        CurriculumData.user_id == user.id
    ).all()
    
    # Calculate overall statistics
    total_topics = len(curriculum_records)
    watched_topics = sum(1 for record in curriculum_records if record.watched)
    revised_topics = sum(1 for record in curriculum_records if record.revised)
    tested_topics = sum(1 for record in curriculum_records if record.tested)
    overall_progress = (tested_topics / total_topics * 100) if total_topics > 0 else 0
    
    # Group by subject
    subjects_dict = {}
    for record in curriculum_records:
        if record.subject not in subjects_dict:
            subjects_dict[record.subject] = []
        subjects_dict[record.subject].append(record)
    
    # Convert to response format
    subjects_response = []
    for subject, records in subjects_dict.items():
        topics_response = [
            CurriculumTopicResponse(
                id=record.id,
                user_id=record.user_id,
                subject=record.subject,
                topic=record.topic,
                watched=record.watched,
                revised=record.revised,
                tested=record.tested,
                created_at=record.created_at,
                updated_at=record.updated_at
            )
            for record in records
        ]
        
        watched_count = sum(1 for record in records if record.watched)
        revised_count = sum(1 for record in records if record.revised)
        tested_count = sum(1 for record in records if record.tested)
        
        subjects_response.append(
            CurriculumSubjectResponse(
                subject=subject,
                topics=topics_response,
                watched_count=watched_count,
                revised_count=revised_count,
                tested_count=tested_count,
                total_topics=len(records)
            )
        )
    
    return CurriculumStatsResponse(
        total_topics=total_topics,
        watched_topics=watched_topics,
        revised_topics=revised_topics,
        tested_topics=tested_topics,
        overall_progress=overall_progress,
        subjects=subjects_response
    )

@curriculum_router.get("/subject/{subject}", response_model=CurriculumSubjectResponse)
async def get_curriculum_by_subject(
    subject: str,
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
):
    """Get curriculum data for a specific subject"""
    
    # Get current user
    user = db.query(User).filter(User.email == current_user_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get curriculum records for the subject
    curriculum_records = db.query(CurriculumData).filter(
        CurriculumData.user_id == user.id,
        CurriculumData.subject == subject
    ).all()
    
    if not curriculum_records:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No curriculum data found for subject: {subject}"
        )
    
    # Convert to response format
    topics_response = [
        CurriculumTopicResponse(
            id=record.id,
            user_id=record.user_id,
            subject=record.subject,
            topic=record.topic,
            watched=record.watched,
            revised=record.revised,
            tested=record.tested,
            created_at=record.created_at,
            updated_at=record.updated_at
        )
        for record in curriculum_records
    ]
    
    watched_count = sum(1 for record in curriculum_records if record.watched)
    revised_count = sum(1 for record in curriculum_records if record.revised)
    tested_count = sum(1 for record in curriculum_records if record.tested)
    
    return CurriculumSubjectResponse(
        subject=subject,
        topics=topics_response,
        watched_count=watched_count,
        revised_count=revised_count,
        tested_count=tested_count,
        total_topics=len(curriculum_records)
    )

# Visitor endpoints (for non-authenticated users)

@curriculum_router.post("/visitor/save", response_model=CurriculumTopicResponse)
async def save_visitor_curriculum_topic(
    topic_data: CurriculumTopicCreate,
    visitor_id: str,
    db: Session = Depends(get_db)
):
    """Save curriculum topic for visitor (non-authenticated user)"""
    
    # Check if curriculum topic already exists
    existing_record = db.query(CurriculumData).filter(
        CurriculumData.visitor_id == visitor_id,
        CurriculumData.subject == topic_data.subject,
        CurriculumData.topic == topic_data.topic
    ).first()
    
    if existing_record:
        # Update existing record
        existing_record.watched = topic_data.watched
        existing_record.revised = topic_data.revised
        existing_record.tested = topic_data.tested
        existing_record.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_record)
        
        return CurriculumTopicResponse(
            id=existing_record.id,
            visitor_id=existing_record.visitor_id,
            subject=existing_record.subject,
            topic=existing_record.topic,
            watched=existing_record.watched,
            revised=existing_record.revised,
            tested=existing_record.tested,
            created_at=existing_record.created_at,
            updated_at=existing_record.updated_at
        )
    else:
        # Create new record
        new_record = CurriculumData(
            visitor_id=visitor_id,
            subject=topic_data.subject,
            topic=topic_data.topic,
            watched=topic_data.watched,
            revised=topic_data.revised,
            tested=topic_data.tested
        )
        
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        
        return CurriculumTopicResponse(
            id=new_record.id,
            visitor_id=new_record.visitor_id,
            subject=new_record.subject,
            topic=new_record.topic,
            watched=new_record.watched,
            revised=new_record.revised,
            tested=new_record.tested,
            created_at=new_record.created_at,
            updated_at=new_record.updated_at
        )

@curriculum_router.get("/visitor/{visitor_id}", response_model=CurriculumStatsResponse)
async def get_visitor_curriculum_data(
    visitor_id: str,
    db: Session = Depends(get_db)
):
    """Get all curriculum data for visitor"""
    
    # Get all curriculum records for visitor
    curriculum_records = db.query(CurriculumData).filter(
        CurriculumData.visitor_id == visitor_id
    ).all()
    
    # Calculate overall statistics
    total_topics = len(curriculum_records)
    watched_topics = sum(1 for record in curriculum_records if record.watched)
    revised_topics = sum(1 for record in curriculum_records if record.revised)
    tested_topics = sum(1 for record in curriculum_records if record.tested)
    overall_progress = (tested_topics / total_topics * 100) if total_topics > 0 else 0
    
    # Group by subject
    subjects_dict = {}
    for record in curriculum_records:
        if record.subject not in subjects_dict:
            subjects_dict[record.subject] = []
        subjects_dict[record.subject].append(record)
    
    # Convert to response format
    subjects_response = []
    for subject, records in subjects_dict.items():
        topics_response = [
            CurriculumTopicResponse(
                id=record.id,
                visitor_id=record.visitor_id,
                subject=record.subject,
                topic=record.topic,
                watched=record.watched,
                revised=record.revised,
                tested=record.tested,
                created_at=record.created_at,
                updated_at=record.updated_at
            )
            for record in records
        ]
        
        watched_count = sum(1 for record in records if record.watched)
        revised_count = sum(1 for record in records if record.revised)
        tested_count = sum(1 for record in records if record.tested)
        
        subjects_response.append(
            CurriculumSubjectResponse(
                subject=subject,
                topics=topics_response,
                watched_count=watched_count,
                revised_count=revised_count,
                tested_count=tested_count,
                total_topics=len(records)
            )
        )
    
    return CurriculumStatsResponse(
        total_topics=total_topics,
        watched_topics=watched_topics,
        revised_topics=revised_topics,
        tested_topics=tested_topics,
        overall_progress=overall_progress,
        subjects=subjects_response
    )
