import rateLimit from 'express-rate-limit';

// General rate limiter - 100 requests per 15 minutes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
  handler: (req, res) => {
    res.status(429).json({ message: 'Too many requests, please try again later' });
  }
});

// Signup limiter - 5 attempts per hour
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many signup attempts, please try again later',
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
  handler: (req, res) => {
    res.status(429).json({ message: 'Too many signup attempts, please try again later' });
  }
});

// Login limiter - 10 failed attempts per hour
export const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
  handler: (req, res) => {
    res.status(429).json({ message: 'Too many login attempts, please try again later' });
  }
});

// OTP limiter - 5 attempts per hour
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many OTP attempts, please try again later',
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
  handler: (req, res) => {
    res.status(429).json({ message: 'Too many OTP attempts, please try again later' });
  }
});

// Resend OTP limiter - 3 resend attempts per hour
export const resendOTPLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many OTP resend attempts, please try again later',
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
  handler: (req, res) => {
    res.status(429).json({ message: 'Too many OTP resend attempts, please try again later' });
  }
});
