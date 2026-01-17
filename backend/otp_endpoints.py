from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import jwt
from typing import Dict, Any

# Import our database models and dependencies
from database_models import get_db, User
from utils import SECRET_KEY, ALGORITHM, create_access_token, get_password_hash, verify_password
from otp_utils import generate_otp, hash_otp, verify_otp_hash, send_otp_email, temp_users
from otp_models import OTPRequest, OTPVerify, OTPResend, OTPLogin, OTPResponse, TokenResponse

# Create router for OTP endpoints
otp_router = APIRouter(prefix="/api/auth", tags=["OTP Authentication"])

@otp_router.post("/signup", response_model=OTPResponse)
async def signup_with_otp(request: OTPRequest, db: Session = Depends(get_db)):
    """Initiate signup with OTP"""
    email = request.email
    
    # Check if user already exists and is verified
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user and existing_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered and verified"
        )
    
    # Generate OTP
    otp = generate_otp()
    hashed_otp = hash_otp(otp)
    expiry = datetime.utcnow() + timedelta(minutes=5)
    
    # Store in temporary storage (overwrite if exists)
    temp_users[email] = {
        "otp_hash": hashed_otp,
        "otp_expiry": expiry,
        "signup_pending": True
    }
    
    # Send OTP email
    if not send_otp_email(email, otp):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP email"
        )
    
    return OTPResponse(message="OTP sent to email. Please verify to complete signup")

@otp_router.post("/verify-otp", response_model=OTPResponse)
async def verify_otp_endpoint(request: OTPVerify, db: Session = Depends(get_db)):
    """Verify OTP for signup or login"""
    email = request.email
    otp = request.otp
    
    # First check if user is in temporary storage (new signup)
    if email in temp_users and temp_users[email].get('signup_pending', False):
        temp_user_data = temp_users[email]
        
        if datetime.utcnow() > temp_user_data['otp_expiry']:
            temp_users.pop(email, None)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP expired"
            )
        
        if not verify_otp_hash(otp, temp_user_data['otp_hash']):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP"
            )
        
        # Mark as verified in temp storage (waiting for password)
        temp_users[email]['signup_pending'] = False
        temp_users[email]['verified'] = True
        
        return OTPResponse(message="OTP verified successfully. Please set your password to complete registration")
    
    # If not in temp storage, check existing user (login verification)
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_verified:
        return OTPResponse(message="User already verified")
    
    if datetime.utcnow() > user.otp_expiry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired"
        )
    
    if not verify_otp_hash(otp, user.otp_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )
    
    # Mark user as verified
    user.is_verified = True
    user.otp_hash = None
    user.otp_expiry = None
    db.commit()
    
    return OTPResponse(message="OTP verified successfully")

@otp_router.post("/complete-signup", response_model=TokenResponse)
async def complete_signup(request: OTPLogin, db: Session = Depends(get_db)):
    """Complete signup after OTP verification"""
    email = request.email
    password = request.password
    
    # Check if user is verified in temp storage
    if email not in temp_users or not temp_users[email].get('verified', False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please verify OTP first"
        )
    
    # Check if user already exists in database
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create permanent user in database
    hashed_password = get_password_hash(password)
    new_user = User(
        email=email,
        password_hash=hashed_password,
        name=email.split('@')[0],  # Default name from email
        is_verified=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Remove from temporary storage
    temp_users.pop(email, None)
    
    # Create access token
    access_token_expires = timedelta(hours=2)
    access_token = create_access_token(
        data={"sub": email}, expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": new_user.id,
            "email": new_user.email,
            "name": new_user.name
        }
    )

@otp_router.post("/resend-otp", response_model=OTPResponse)
async def resend_otp(request: OTPResend, db: Session = Depends(get_db)):
    """Resend OTP for signup or verification"""
    email = request.email
    
    # First check if user is in temporary storage (pending signup)
    if email in temp_users:
        temp_user_data = temp_users[email]
        
        if temp_user_data.get('verified', False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already verified"
            )
        
        # Generate new OTP
        otp = generate_otp()
        hashed_otp = hash_otp(otp)
        expiry = datetime.utcnow() + timedelta(minutes=5)
        
        # Update temporary storage
        temp_users[email]['otp_hash'] = hashed_otp
        temp_users[email]['otp_expiry'] = expiry
        
        # Send OTP email
        if not send_otp_email(email, otp):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send OTP email"
            )
        
        return OTPResponse(message="OTP resent successfully")
    
    # If not in temp storage, check existing user
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already verified"
        )
    
    # Generate new OTP
    otp = generate_otp()
    user.otp_hash = hash_otp(otp)
    user.otp_expiry = datetime.utcnow() + timedelta(minutes=5)
    
    db.commit()
    
    # Send OTP email
    if not send_otp_email(email, otp):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP email"
        )
    
    return OTPResponse(message="OTP resent successfully")

@otp_router.post("/login-otp", response_model=OTPResponse)
async def login_with_otp_request(request: OTPRequest, db: Session = Depends(get_db)):
    """Request OTP for login"""
    email = request.email
    
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Don't reveal if user exists or not for security
        return OTPResponse(message="If account exists, OTP will be sent to your email")
    
    # Generate OTP
    otp = generate_otp()
    hashed_otp = hash_otp(otp)
    expiry = datetime.utcnow() + timedelta(minutes=5)
    
    # Store OTP in database
    user.otp_hash = hashed_otp
    user.otp_expiry = expiry
    db.commit()
    
    # Send OTP email
    if not send_otp_email(email, otp):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP email"
        )
    
    return OTPResponse(message="OTP sent to email for login verification")

@otp_router.post("/login-verify", response_model=TokenResponse)
async def login_with_otp_verify(request: OTPVerify, db: Session = Depends(get_db)):
    """Verify OTP and login"""
    email = request.email
    otp = request.otp
    
    # Find user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check OTP expiry
    if datetime.utcnow() > user.otp_expiry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired"
        )
    
    # Verify OTP
    if not verify_otp_hash(otp, user.otp_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )
    
    # Clear OTP after successful verification
    user.otp_hash = None
    user.otp_expiry = None
    user.is_verified = True  # Ensure user is verified
    db.commit()
    
    # Create access token
    access_token_expires = timedelta(hours=2)
    access_token = create_access_token(
        data={"sub": email}, expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name
        }
    )

@otp_router.post("/login", response_model=TokenResponse)
async def login_with_otp(request: OTPLogin, db: Session = Depends(get_db)):
    """Login user with email and password"""
    email = request.email
    password = request.password
    
    # Find user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is verified
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify OTP first"
        )
    
    # Verify password
    if not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create access token
    access_token_expires = timedelta(hours=2)
    access_token = create_access_token(
        data={"sub": email}, expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name
        }
    )
