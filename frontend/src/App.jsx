import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import OtpSignup from './pages/OtpSignup';
import OtpLogin from './pages/OtpLogin';
import Curriculum from './pages/Curriculum';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // Simulate loading time
      const timer = setTimeout(() => {
        setLoading(false);
      }, 500);
      
      return () => clearTimeout(timer);
    } catch (err) {
      console.error('App initialization error:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="app loading">
        <div className="spinner"></div>
        <p style={{ color: '#60a5fa', marginTop: '1rem' }}>Loading Win GATE...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        background: '#f3f4f6',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <h1 style={{ color: '#dc2626', marginBottom: '1rem' }}>App Error</h1>
        <p style={{ color: '#374151', marginBottom: '1rem' }}>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            padding: '0.75rem 1.5rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<OtpSignup />} />
        <Route path="/otp-login" element={<OtpLogin />} />
        <Route path="/legacy-signup" element={<Signup />} />
        <Route path="/curriculum" element={<Curriculum />} />
      </Routes>
    </div>
  );
}

export default App;
