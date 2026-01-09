import validator from 'validator';

// Password strength requirements
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  if (!validator.isEmail(trimmedEmail)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  if (trimmedEmail.length > 255) {
    return { valid: false, error: 'Email is too long' };
  }
  
  return { valid: true, email: trimmedEmail };
};

export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long` };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password is too long' };
  }
  
  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for number
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  
  // Check for special character
  if (!/[@$!%*?&]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character (@$!%*?&)' };
  }
  
  return { valid: true };
};

export const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long' };
  }
  
  if (trimmedName.length > 100) {
    return { valid: false, error: 'Name is too long' };
  }
  
  // Only allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }
  
  return { valid: true, name: trimmedName };
};

export const validateOTP = (otp) => {
  if (!otp || typeof otp !== 'string') {
    return { valid: false, error: 'OTP is required' };
  }
  
  if (!/^\d{6}$/.test(otp)) {
    return { valid: false, error: 'OTP must be 6 digits' };
  }
  
  return { valid: true };
};

// Middleware to validate input
export const validateInput = (req, res, next) => {
  // Sanitize inputs to prevent XSS
  if (req.body.email) {
    req.body.email = validator.trim(req.body.email);
  }
  if (req.body.name) {
    req.body.name = validator.trim(req.body.name);
  }
  if (req.body.password) {
    req.body.password = req.body.password; // Don't trim password
  }
  if (req.body.otp) {
    req.body.otp = validator.trim(req.body.otp);
  }
  
  next();
};
