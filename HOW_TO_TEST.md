# 🎯 How to Test Login & Signup - Step by Step

## ✅ Current Status
- **Backend**: Running on http://localhost:5000 ✅
- **Frontend**: Running on http://localhost:5173 ✅
- **Database**: SQLite ready ✅
- **Authentication**: Working perfectly ✅

## 📱 Testing in Browser

### Step 1: Open the App
Go to: **http://localhost:5173/**
- You'll be automatically redirected to `/login` since you're not authenticated
- You should see the **Login page** with email and password fields

### Step 2: Create a New Account (Signup)
1. Click the **"Sign up here"** link at the bottom of the login page
2. Fill in the form:
   - **Full Name**: Any name (e.g., "John Doe")
   - **Email**: Any valid email (e.g., "test@example.com")
   - **Password**: Must have:
     - At least 8 characters
     - 1 Uppercase letter (A-Z)
     - 1 Lowercase letter (a-z)
     - 1 Number (0-9)
     - 1 Special character (@$!%*?&)
     - Example: `Test@Pass123` ✅
   - **Confirm Password**: Same as password

3. Click **"Sign Up"** button
4. **What happens next:**
   - ✅ Account is created
   - ✅ You're automatically logged in
   - ✅ Token is stored in browser
   - ✅ **You'll be redirected to the Dashboard** 🎉

### Step 3: Logout and Test Login
1. On the Dashboard, click the **"Logout"** button (top right)
   - Token is cleared from browser
   - You'll be sent back to Login page

2. Now test **Login** with the same credentials:
   - **Email**: The email you just signed up with
   - **Password**: The password you created
   
3. Click **"Login"** button
4. **What happens:**
   - ✅ Credentials are verified
   - ✅ Token is issued
   - ✅ **You're logged in and sent to Dashboard** 🎉

### Step 4: Try Invalid Credentials (Error Testing)
1. On Login page, enter:
   - **Email**: test@example.com
   - **Password**: wrongpassword
2. Click **"Login"**
3. **Expected**: Red error message "Invalid credentials" ❌

## 🔒 Security Features (Behind the Scenes)

✅ **Password Hashing**: Passwords encrypted with Bcrypt (not stored as plain text)
✅ **Rate Limiting**: Can't brute force - signup/login limited to X attempts/hour
✅ **Input Validation**: Email format checked, password strength enforced
✅ **JWT Tokens**: Secure token-based authentication (24 hour expiry)
✅ **Audit Logging**: All attempts logged to `/backend/logs/audit.log`
✅ **CORS Protection**: Only localhost origins allowed
✅ **HTTP Security**: Helmet.js protecting against common web vulnerabilities

## 🐛 Troubleshooting

### "Nothing happens after signup"
**Solution**: This is now FIXED! The page should automatically redirect to dashboard.
- If it's not working, check browser console (F12 → Console tab) for errors
- Make sure backend is running on port 5000

### "Login doesn't work"
**Possible causes**:
1. **Typo in credentials** - Password is case-sensitive and exact match required
2. **Backend not running** - Check terminal for backend (should show "✅ Server running")
3. **Token expired** - Try logging out and logging in again

### "Still stuck on login page"
1. Open **Developer Tools** (F12 or Right-click → Inspect)
2. Go to **Console** tab
3. Paste this and press Enter:
   ```javascript
   localStorage.getItem('token')
   ```
4. If it returns `null`, token wasn't saved
5. If it returns a long string, token was saved - check if redirect happened

### "Clear browser cache"
Sometimes browser cache causes issues. Clear it:
1. Press **Ctrl+Shift+Delete**
2. Select "All time" and "Cookies and cached images"
3. Click "Clear data"
4. Refresh the page and try again

### "Test Password Validation"
Try these passwords to see validation in action:

❌ **Invalid**:
- `test123` - Too short, no uppercase
- `TEST@PASS` - No number
- `Test@Pass` - No number
- `test@pass1` - No uppercase

✅ **Valid**:
- `Test@Pass123`
- `MyGate@2024`
- `Secure!Pass99`
- `Hello@World1`

## 📊 What's in the Database

After signup, a new user record is created with:
```
id: 1
email: your@email.com
password: [hashed with bcrypt]
name: Your Name
verified: 1 (auto-verified)
created_at: 2026-01-09 12:34:56
updated_at: 2026-01-09 12:34:56
```

## 🎮 API Endpoints (For Advanced Users)

You can also test endpoints directly with curl or Postman:

**Signup**:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@Pass123",
    "name": "Test User"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@Pass123"
  }'
```

**Get Current User** (requires token):
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## ✨ Summary

1. Open http://localhost:5173
2. Click "Sign up here"
3. Fill form with valid credentials
4. Click "Sign Up"
5. ✅ **Automatically logged in and sent to Dashboard!**
6. Try **Logout** then **Login** with same credentials
7. ✅ **Should work perfectly!**

---

**If you still have issues, check:**
1. Backend terminal shows no errors
2. Frontend terminal shows no errors
3. Browser console (F12) shows no errors
4. Both servers running on correct ports (5000 and 5173)

**All tests passing! ✅ System is ready!**
