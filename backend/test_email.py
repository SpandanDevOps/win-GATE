"""
Test script to verify email configuration
"""
import os
from dotenv import load_dotenv

load_dotenv()

print("🔍 Testing Email Configuration")
print("=" * 40)

EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = os.getenv("EMAIL_PORT")
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

print(f"EMAIL_HOST: {EMAIL_HOST}")
print(f"EMAIL_PORT: {EMAIL_PORT}")
print(f"EMAIL_USER: {EMAIL_USER}")
print(f"EMAIL_PASSWORD: {'*' * len(EMAIL_PASSWORD) if EMAIL_PASSWORD else 'NOT SET'}")

if not all([EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD]):
    print("❌ Missing email configuration!")
    exit(1)

print("\n✅ All email variables are set")

# Test SMTP connection
import smtplib

try:
    print(f"\n🔌 Testing connection to {EMAIL_HOST}:{EMAIL_PORT}...")
    server = smtplib.SMTP(EMAIL_HOST, int(EMAIL_PORT))
    print("✅ Connected to SMTP server")
    
    print("🔐 Testing STARTTLS...")
    server.starttls()
    print("✅ STARTTLS successful")
    
    print("🔐 Testing login...")
    server.login(EMAIL_USER, EMAIL_PASSWORD)
    print("✅ Login successful!")
    
    server.quit()
    print("\n🎉 Email configuration is working!")
    
except Exception as e:
    print(f"\n❌ Email configuration failed: {e}")
    print(f"❌ Error type: {type(e).__name__}")
    
    if "535" in str(e):
        print("\n💡 Gmail authentication failed. Check:")
        print("   1. 2FA is enabled on your Gmail account")
        print("   2. You're using an App Password (not regular password)")
        print("   3. App Password is correct")
    elif "534" in str(e):
        print("\n💡 Gmail requires 'Allow less secure apps' or use App Password")
    elif "timeout" in str(e).lower():
        print("\n💡 Network timeout. Check internet connection")
