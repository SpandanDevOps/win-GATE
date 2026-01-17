from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import jwt
import bcrypt
from passlib.context import CryptContext
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import random
import string

# Import our database models and dependencies
from database_models import get_db, User, StudyHours, CurriculumData
from database_models import engine, SessionLocal
from database_models import Base, create_tables

# Import utilities
from utils import pwd_context, SECRET_KEY, ALGORITHM, create_access_token, verify_token

# Import all routers
from auth_endpoints import auth_router
from study_hours_endpoints import study_router
from curriculum_endpoints import curriculum_router
from otp_endpoints import otp_router

# Initialize FastAPI app
app = FastAPI(
    title="Win GATE Study Tracker API",
    description="Backend API for Win GATE Study Tracker application",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://(localhost|127\\.0\\.0\\.1)(:\\d+)?$",
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Email configuration (optional)
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USER = os.getenv("EMAIL_USER", "your-email@gmail.com")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "your-app-password")



# Include all routers
app.include_router(auth_router)
app.include_router(study_router)
app.include_router(curriculum_router)
app.include_router(otp_router)

# Initialize database tables
@app.on_event("startup")
def startup_event():
    create_tables()
    print("Database tables created successfully!")

# Health check endpoints
@app.get("/")
def read_root():
    return {"message": "Win GATE Study Tracker API", "status": "healthy"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# API documentation endpoint
@app.get("/docs-info")
def get_api_docs_info():
    return {
        "title": "Win GATE Study Tracker API",
        "description": "Complete API documentation available at /docs",
        "endpoints": {
            "Authentication": "/api/auth",
            "Study Hours": "/api/study-hours",
            "Curriculum": "/api/curriculum"
        },
        "features": [
            "User registration with email verification",
            "JWT-based authentication",
            "Study hours tracking for authenticated users",
            "Curriculum management with progress tracking",
            "PostgreSQL database with SQLAlchemy ORM"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
