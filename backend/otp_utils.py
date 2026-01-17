import smtplib
import random
import string
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import bcrypt
from typing import Dict, Any
import threading
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Email configuration
EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = int(os.getenv("EMAIL_PORT"))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

# Temporary storage for unverified users
temp_users: Dict[str, Dict[str, Any]] = {}

def generate_otp(length: int = 6) -> str:
    """Generate a random OTP"""
    otp = ''.join(random.choices(string.digits, k=length))
    print(f"🔢 Generated OTP: {otp}")
    return otp

def hash_otp(otp: str) -> str:
    """Hash OTP using bcrypt"""
    return bcrypt.hashpw(otp.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_otp_hash(otp: str, hashed_otp: str) -> bool:
    """Verify OTP against hash"""
    return bcrypt.checkpw(otp.encode('utf-8'), hashed_otp.encode('utf-8'))

def send_otp_email(email: str, otp: str) -> bool:
    """Send OTP email"""
    try:
        print(f"📧 Attempting to send OTP to {email}")
        print(f"🔧 Email config: {EMAIL_HOST}:{EMAIL_PORT}, User: {EMAIL_USER}")
        
        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = email
        msg['Subject'] = "OTP Verification - Win GATE"
        
        body = f"""
        <html>
        <body>
            <h2>Win GATE - OTP Verification</h2>
            <p>Your OTP code is: <strong>{otp}</strong></p>
            <p>This OTP will expire in 5 minutes.</p>
            <p>If you didn't request this OTP, please ignore this email.</p>
            <br>
            <p>Best regards,<br>Win GATE Team</p>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        print("🔌 Connecting to SMTP server...")
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        server.starttls()
        print("🔐 Logging into SMTP...")
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        text = msg.as_string()
        print("📤 Sending email...")
        server.sendmail(EMAIL_USER, email, text)
        server.quit()
        
        print(f"✅ OTP email sent successfully to {email}")
        return True
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        print(f"❌ Error type: {type(e).__name__}")
        return False

def cleanup_expired_temp_users():
    """Clean up expired temporary users every 5 minutes"""
    while True:
        time.sleep(300)  # 5 minutes
        current_time = datetime.utcnow()
        expired_emails = []
        for email, data in temp_users.items():
            if current_time > data['otp_expiry']:
                expired_emails.append(email)
        for email in expired_emails:
            temp_users.pop(email, None)
            print(f"Cleaned up expired temp user: {email}")

# Start cleanup thread
cleanup_thread = threading.Thread(target=cleanup_expired_temp_users, daemon=True)
cleanup_thread.start()
