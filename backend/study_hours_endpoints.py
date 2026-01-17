from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import os

# Import our database models and dependencies
from database_models import get_db, User, StudyHours, CurriculumData
from utils import pwd_context, SECRET_KEY, ALGORITHM, create_access_token, verify_token

# Create router for study hours endpoints
study_router = APIRouter(prefix="/api/study-hours", tags=["Study Hours"])

# Pydantic models for request/response
from pydantic import BaseModel

class StudyHoursCreate(BaseModel):
    month: int
    year: int
    day: int
    hours: float

class StudyHoursResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    visitor_id: Optional[str] = None 
    month: int
    year: int
    day: int
    hours: float
    created_at: datetime
    updated_at: datetime

class StudyHoursListResponse(BaseModel):
    data: List[StudyHoursResponse]
    total_hours: float
    average_hours: float
    progress_percentage: float

# Authentication dependency for user endpoints
def get_current_user_email(current_user_email: str = Depends(verify_token)):
    return current_user_email

# Study Hours endpoints for authenticated users

@study_router.post("/save-day", response_model=StudyHoursResponse)
async def save_study_hours(
    study_data: StudyHoursCreate,
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
):
    """Save study hours for authenticated user"""
    
    # Get current user
    user = db.query(User).filter(User.email == current_user_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if study hours already exist for this day
    existing_record = db.query(StudyHours).filter(
        StudyHours.user_id == user.id,
        StudyHours.month == study_data.month,
        StudyHours.year == study_data.year,
        StudyHours.day == study_data.day
    ).first()
    
    if existing_record:
        # Update existing record
        existing_record.hours = study_data.hours
        existing_record.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_record)
        
        return StudyHoursResponse(
            id=existing_record.id,
            user_id=existing_record.user_id,
            month=existing_record.month,
            year=existing_record.year,
            day=existing_record.day,
            hours=existing_record.hours,
            created_at=existing_record.created_at,
            updated_at=existing_record.updated_at
        )
    else:
        # Create new record
        new_record = StudyHours(
            user_id=user.id,
            month=study_data.month,
            year=study_data.year,
            day=study_data.day,
            hours=study_data.hours
        )
        
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        
        return StudyHoursResponse(
            id=new_record.id,
            user_id=new_record.user_id,
            month=new_record.month,
            year=new_record.year,
            day=new_record.day,
            hours=new_record.hours,
            created_at=new_record.created_at,
            updated_at=new_record.updated_at
        )

@study_router.get("/month/{month}/{year}", response_model=StudyHoursListResponse)
async def get_month_study_hours(
    month: int,
    year: int,
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
):
    """Get study hours for a specific month and year"""
    
    # Get current user
    user = db.query(User).filter(User.email == current_user_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get study hours for the month
    study_records = db.query(StudyHours).filter(
        StudyHours.user_id == user.id,
        StudyHours.month == month,
        StudyHours.year == year
    ).all()
    
    # Calculate statistics
    total_hours = sum(record.hours for record in study_records)
    average_hours = total_hours / len(study_records) if study_records else 0
    
    # Calculate progress (assuming 7 hours per day target)
    days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month-1] if month > 0 else 31
    target_hours = days_in_month * 7  # 7 hours per day target
    progress_percentage = (total_hours / target_hours * 100) if target_hours > 0 else 0
    
    # Convert to response format
    response_data = [
        StudyHoursResponse(
            id=record.id,
            user_id=record.user_id,
            month=record.month,
            year=record.year,
            day=record.day,
            hours=record.hours,
            created_at=record.created_at,
            updated_at=record.updated_at
        )
        for record in study_records
    ]
    
    return StudyHoursListResponse(
        data=response_data,
        total_hours=total_hours,
        average_hours=average_hours,
        progress_percentage=progress_percentage
    )

@study_router.get("/all", response_model=List[StudyHoursResponse])
async def get_all_study_hours(
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
):
    """Get all study hours for authenticated user"""
    
    # Get current user
    user = db.query(User).filter(User.email == current_user_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get all study hours
    study_records = db.query(StudyHours).filter(
        StudyHours.user_id == user.id
    ).all()
    
    # Convert to response format
    response_data = [
        StudyHoursResponse(
            id=record.id,
            user_id=record.user_id,
            month=record.month,
            year=record.year,
            day=record.day,
            hours=record.hours,
            created_at=record.created_at,
            updated_at=record.updated_at
        )
        for record in study_records
    ]
    
    return response_data

@study_router.delete("/all", response_model=dict)
async def delete_all_study_hours(
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
):
    """Delete all study hours for authenticated user"""
    
    # Get current user
    user = db.query(User).filter(User.email == current_user_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Delete all study hours for this user
    deleted_count = db.query(StudyHours).filter(
        StudyHours.user_id == user.id
    ).delete(synchronize_session=False)
    
    db.commit()
    
    return {"message": f"Deleted {deleted_count} study hours records", "deleted_count": deleted_count}

# Visitor endpoints (for non-authenticated users)

@study_router.post("/visitor/save-day", response_model=StudyHoursResponse)
async def save_visitor_study_hours(
    study_data: StudyHoursCreate,
    visitor_id: str,
    db: Session = Depends(get_db)
):
    """Save study hours for visitor (non-authenticated user)"""
    
    # Check if study hours already exist for this day
    existing_record = db.query(StudyHours).filter(
        StudyHours.visitor_id == visitor_id,
        StudyHours.month == study_data.month,
        StudyHours.year == study_data.year,
        StudyHours.day == study_data.day
    ).first()
    
    if existing_record:
        # Update existing record
        existing_record.hours = study_data.hours
        existing_record.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_record)
        
        return StudyHoursResponse(
            id=existing_record.id,
            visitor_id=existing_record.visitor_id,
            month=existing_record.month,
            year=existing_record.year,
            day=existing_record.day,
            hours=existing_record.hours,
            created_at=existing_record.created_at,
            updated_at=existing_record.updated_at
        )
    else:
        # Create new record
        new_record = StudyHours(
            visitor_id=visitor_id,
            month=study_data.month,
            year=study_data.year,
            day=study_data.day,
            hours=study_data.hours
        )
        
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        
        return StudyHoursResponse(
            id=new_record.id,
            visitor_id=new_record.visitor_id,
            month=new_record.month,
            year=new_record.year,
            day=new_record.day,
            hours=new_record.hours,
            created_at=new_record.created_at,
            updated_at=new_record.updated_at
        )

@study_router.get("/visitor/{visitor_id}/{month}/{year}", response_model=StudyHoursListResponse)
async def get_visitor_month_study_hours(
    visitor_id: str,
    month: int,
    year: int,
    db: Session = Depends(get_db)
):
    """Get study hours for a specific month and year for visitor"""
    
    # Get study hours for the month
    study_records = db.query(StudyHours).filter(
        StudyHours.visitor_id == visitor_id,
        StudyHours.month == month,
        StudyHours.year == year
    ).all()
    
    # Calculate statistics
    total_hours = sum(record.hours for record in study_records)
    average_hours = total_hours / len(study_records) if study_records else 0
    
    # Calculate progress
    days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month-1] if month > 0 else 31
    target_hours = days_in_month * 7
    progress_percentage = (total_hours / target_hours * 100) if target_hours > 0 else 0
    
    # Convert to response format
    response_data = [
        StudyHoursResponse(
            id=record.id,
            visitor_id=record.visitor_id,
            month=record.month,
            year=record.year,
            day=record.day,
            hours=record.hours,
            created_at=record.created_at,
            updated_at=record.updated_at
        )
        for record in study_records
    ]
    
    return StudyHoursListResponse(
        data=response_data,
        total_hours=total_hours,
        average_hours=average_hours,
        progress_percentage=progress_percentage
    )

@study_router.delete("/visitor/{visitor_id}/all", response_model=dict)
async def delete_visitor_all_study_hours(
    visitor_id: str,
    db: Session = Depends(get_db)
):
    """Delete all study hours for visitor"""
    
    # Delete all study hours for this visitor
    deleted_count = db.query(StudyHours).filter(
        StudyHours.visitor_id == visitor_id
    ).delete(synchronize_session=False)
    
    db.commit()
    
    return {"message": f"Deleted {deleted_count} visitor study hours records", "deleted_count": deleted_count}
