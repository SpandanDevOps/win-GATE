# OTP Authentication Setup Guide

## Overview
This guide explains how to set up and use the OTP (One-Time Password) authentication system that has been integrated into your Win GATE backend.

## New Files Added
- `otp_endpoints.py` - OTP authentication endpoints
- `otp_models.py` - Pydantic models for OTP requests/responses
- `otp_utils.py` - OTP utility functions (generation, email sending, cleanup)

## Database Changes
The `User` model has been updated with new fields:
- `is_verified` - Boolean field to track email verification status
- `otp_hash` - Hashed OTP storage
- `otp_expiry` - OTP expiration timestamp

## API Endpoints

### 1. Initiate Signup with OTP
```
POST /api/auth/signup
{
  "email": "user@example.com"
}
```
Response: 
```json
{
  "message": "OTP sent to email. Please verify to complete signup"
}
```

### 2. Verify OTP
```
POST /api/auth/verify-otp
{
  "email": "user@example.com",
  "otp": "123456"
}
```
Response:
```json
{
  "message": "OTP verified successfully. Please set your password to complete registration"
}
```

### 3. Complete Signup (Set Password)
```
POST /api/auth/complete-signup
{
  "email": "user@example.com",
  "password": "userpassword"
}
```
Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "user"
  }
}
```

### 4. Resend OTP
```
POST /api/auth/resend-otp
{
  "email": "user@example.com"
}
```

### 5. Login (After OTP Verification)
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

## Email Configuration
Update your `.env` file with your email settings:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Important**: For Gmail, you need to:
1. Enable 2-factor authentication
2. Generate an App Password (not your regular password)
3. Use the App Password in EMAIL_PASSWORD

## Security Features
- OTPs expire after 5 minutes
- OTPs are hashed using bcrypt before storage
- Temporary storage for unverified users with automatic cleanup
- Users must verify OTP before setting password
- JWT tokens for authenticated sessions

## Frontend Integration
To integrate with your frontend:

1. Update your signup flow:
   - First call `/api/auth/signup` with email
   - Show OTP input field
   - Call `/api/auth/verify-otp` with email and OTP
   - Show password field
   - Call `/api/auth/complete-signup` with email and password

2. Update your login flow:
   - Use `/api/auth/login` endpoint (same as before)
   - Handle unverified user error appropriately

## Testing
You can test the OTP system without actual email sending by:
1. Checking the console output for generated OTPs
2. Using a service like Mailtrap for email testing

## Production Considerations
1. Use a proper email service (SendGrid, AWS SES, etc.) in production
2. Set up proper domain authentication (SPF, DKIM, DMARC)
3. Monitor email deliverability
4. Consider rate limiting for OTP requests
5. Implement proper error handling for email failures

## Migration Notes
If you have existing users in your database:
- They will need to go through OTP verification
- Or you can mark existing users as verified manually:
  ```sql
  UPDATE users SET is_verified = true WHERE email = 'existing@example.com';
  ```
