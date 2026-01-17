import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Award, Shield, Key } from 'lucide-react';
import '../styles/Auth.css';
import '../styles/OtpAuth.css';

function OtpSignup() {
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.detail || 'Failed to send OTP');
        return;
      }

      setMessage('OTP sent to your email. Please check your inbox.');
      setStep(2);
    } catch (err) {
      setError('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.detail || 'Invalid OTP');
        return;
      }

      setMessage('OTP verified successfully! Please set your password.');
      setStep(3);
    } catch (err) {
      setError('Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/complete-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.detail || 'Registration failed');
        return;
      }

      // Store token and user data
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      navigate('/dashboard');
    } catch (err) {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setResendLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.detail || 'Failed to resend OTP');
        return;
      }

      setMessage('OTP resent successfully. Please check your email.');
    } catch (err) {
      setError('Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <div className="auth-header">
        <div className="auth-logo">🎓</div>
        <h1>Win GATE</h1>
        <p>Create your account</p>
      </div>

      {error && <div className="auth-error">{error}</div>}
      {message && <div className="auth-success">{message}</div>}

      <form onSubmit={handleSendOtp} className="auth-form">
        <div className="form-group">
          <label>Email Address</label>
          <div className="input-wrapper">
            <Mail size={20} className="input-icon" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
        </div>

        <button type="submit" className="auth-button" disabled={loading}>
          <Shield size={20} />
          {loading ? 'Sending OTP...' : 'Send OTP'}
        </button>
      </form>
    </>
  );

  const renderStep2 = () => (
    <>
      <div className="auth-header">
        <div className="auth-logo">🔐</div>
        <h1>Verify Email</h1>
        <p>Enter the OTP sent to {email}</p>
      </div>

      {error && <div className="auth-error">{error}</div>}
      {message && <div className="auth-success">{message}</div>}

      <form onSubmit={handleVerifyOtp} className="auth-form">
        <div className="form-group">
          <label>One-Time Password</label>
          <div className="input-wrapper">
            <Key size={20} className="input-icon" />
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              required
              className="otp-input"
            />
          </div>
        </div>

        <button type="submit" className="auth-button" disabled={loading}>
          <Shield size={20} />
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>

        <button 
          type="button" 
          onClick={handleResendOtp} 
          className="auth-button auth-button-secondary"
          disabled={resendLoading}
        >
          {resendLoading ? 'Resending...' : 'Resend OTP'}
        </button>
      </form>
    </>
  );

  const renderStep3 = () => (
    <>
      <div className="auth-header">
        <div className="auth-logo">🎓</div>
        <h1>Win GATE</h1>
        <p>Set your password</p>
      </div>

      {error && <div className="auth-error">{error}</div>}
      {message && <div className="auth-success">{message}</div>}

      <form onSubmit={handleCompleteSignup} className="auth-form">
        <div className="form-group">
          <label>Password</label>
          <div className="input-wrapper">
            <Lock size={20} className="input-icon" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <div className="input-wrapper">
            <Lock size={20} className="input-icon" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
        </div>

        <button type="submit" className="auth-button" disabled={loading}>
          <Award size={20} />
          {loading ? 'Creating account...' : 'Complete Signup'}
        </button>
      </form>
    </>
  );

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="logo-float logo-1"><Award size={40} /></div>
        <div className="logo-float logo-2"><Award size={40} /></div>
        <div className="logo-float logo-3"><Award size={40} /></div>
        <div className="logo-float logo-4"><Award size={40} /></div>
      </div>

      <div className="auth-card">
        {step > 1 && (
          <button 
            onClick={() => setStep(step - 1)} 
            className="auth-back-button"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        )}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  );
}

export default OtpSignup;
