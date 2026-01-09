import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { 
  validateEmail, 
  validatePassword, 
  validateName, 
  validateOTP 
} from '../middleware/validation.js';
import { 
  signupLimiter, 
  loginLimiter, 
  otpLimiter, 
  resendOTPLimiter 
} from '../middleware/rateLimiter.js';

const router = express.Router();

// Temporary storage for OTPs (in production, use Redis or database)
const otpStore = {};

// Generate random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Register endpoint with security
router.post('/register', signupLimiter, (req, res) => {
  const { email, password, name } = req.body;

  // Validate inputs
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    res.auditLog('SIGNUP', email || 'unknown', false, `Validation error: ${emailValidation.error}`);
    return res.status(400).json({ message: emailValidation.error });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    res.auditLog('SIGNUP', emailValidation.email, false, `Validation error: ${passwordValidation.error}`);
    return res.status(400).json({ message: passwordValidation.error });
  }

  const nameValidation = validateName(name);
  if (!nameValidation.valid) {
    res.auditLog('SIGNUP', emailValidation.email, false, `Validation error: ${nameValidation.error}`);
    return res.status(400).json({ message: nameValidation.error });
  }

  const hashedPassword = bcrypt.hashSync(password, 12); // Use 12 rounds for better security
  const db = getDatabase();

  db.run(
    'INSERT INTO users (email, password, name, verified) VALUES (?, ?, ?, ?)',
    [emailValidation.email, hashedPassword, nameValidation.name, 1],
    function(err) {
      if (err) {
        db.close();
        res.auditLog('SIGNUP', emailValidation.email, false, 'Email already exists');
        return res.status(409).json({ message: 'This email is already registered. Please login instead.' });
      }

      const userId = this.lastID;

      // Generate JWT token immediately
      const token = jwt.sign({ id: userId, email: emailValidation.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
      });

      res.auditLog('SIGNUP', emailValidation.email, true, 'User registered successfully');
      db.close();
      res.status(201).json({
        message: 'Registration successful! You are now logged in.',
        token,
        user: {
          id: userId,
          email: emailValidation.email,
          name: nameValidation.name
        }
      });
    }
  );
});

// Verify OTP endpoint with security
router.post('/verify-otp', otpLimiter, (req, res) => {
  const { email, otp } = req.body;

  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return res.status(400).json({ message: 'Invalid email' });
  }

  const otpValidation = validateOTP(otp);
  if (!otpValidation.valid) {
    res.auditLog('VERIFY_OTP', emailValidation.email, false, 'Invalid OTP format');
    return res.status(400).json({ message: otpValidation.error });
  }

  const storedOTP = otpStore[emailValidation.email];

  if (!storedOTP) {
    res.auditLog('VERIFY_OTP', emailValidation.email, false, 'OTP not found or expired');
    return res.status(400).json({ message: 'OTP expired. Please register again.' });
  }

  if (Date.now() > storedOTP.expiresAt) {
    delete otpStore[emailValidation.email];
    res.auditLog('VERIFY_OTP', emailValidation.email, false, 'OTP expired');
    return res.status(400).json({ message: 'OTP expired. Please register again.' });
  }

  if (storedOTP.otp !== otp) {
    storedOTP.attempts = (storedOTP.attempts || 0) + 1;
    if (storedOTP.attempts >= 3) {
      delete otpStore[emailValidation.email];
      res.auditLog('VERIFY_OTP', emailValidation.email, false, 'Too many failed attempts');
      return res.status(429).json({ message: 'Too many failed attempts. Please register again.' });
    }
    res.auditLog('VERIFY_OTP', emailValidation.email, false, `Invalid OTP (attempt ${storedOTP.attempts}/3)`);
    return res.status(400).json({ message: `Invalid OTP. ${3 - storedOTP.attempts} attempts remaining.` });
  }

  const db = getDatabase();

  // Mark user as verified
  db.run(
    'UPDATE users SET verified = 1 WHERE id = ?',
    [storedOTP.userId],
    (err) => {
      if (err) {
        db.close();
        res.auditLog('VERIFY_OTP', emailValidation.email, false, 'Database error during verification');
        return res.status(500).json({ message: 'Verification failed. Please try again.' });
      }

      db.get('SELECT id, email, name FROM users WHERE id = ?', [storedOTP.userId], (err, user) => {
        if (err || !user) {
          db.close();
          res.auditLog('VERIFY_OTP', emailValidation.email, false, 'User not found');
          return res.status(404).json({ message: 'User not found' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRE
        });

        // Clean up OTP
        delete otpStore[emailValidation.email];

        res.auditLog('VERIFY_OTP', emailValidation.email, true, 'OTP verified successfully');
        db.close();
        res.json({
          message: 'Email verified successfully!',
          token,
          user: { id: user.id, email: user.email, name: user.name }
        });
      });
    }
  );
});

// Login endpoint with security
router.post('/login', loginLimiter, (req, res) => {
  const { email, password } = req.body;

  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  if (!password || typeof password !== 'string') {
    res.auditLog('LOGIN', emailValidation.email, false, 'Missing password');
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const db = getDatabase();

  db.get('SELECT * FROM users WHERE email = ?', [emailValidation.email], (err, user) => {
    if (err || !user) {
      db.close();
      res.auditLog('LOGIN', emailValidation.email, false, 'User not found');
      // Don't reveal if user exists
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      db.close();
      res.auditLog('LOGIN', emailValidation.email, false, 'Invalid password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.auditLog('LOGIN', emailValidation.email, true, 'Successful login');
    db.close();
    res.json({
      message: 'Login successful!',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  });
});

// Resend OTP endpoint with security
router.post('/resend-otp', resendOTPLimiter, (req, res) => {
  const { email } = req.body;

  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return res.status(400).json({ message: emailValidation.error });
  }

  const storedOTP = otpStore[emailValidation.email];

  if (!storedOTP) {
    res.auditLog('RESEND_OTP', emailValidation.email, false, 'No registration found');
    return res.status(400).json({ message: 'No pending registration found. Please register again.' });
  }

  // Generate new OTP
  const otp = generateOTP();
  
  // Store OTP with expiry (10 minutes)
  otpStore[emailValidation.email] = {
    otp,
    userId: storedOTP.userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000,
    attempts: 0
  };

  console.log(`📧 New OTP for ${emailValidation.email}: ${otp}`);

  res.auditLog('RESEND_OTP', emailValidation.email, true, 'OTP resent');
  res.json({
    message: 'OTP sent to your email. Valid for 10 minutes.'
  });
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  const db = getDatabase();

  db.get('SELECT id, email, name, created_at, verified FROM users WHERE id = ?', [req.user.id], (err, user) => {
    db.close();
    if (err || !user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  });
});

export default router;
