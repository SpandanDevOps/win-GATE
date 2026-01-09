import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize visitor ID for separated records
    let visitorId = localStorage.getItem('visitorId');
    if (!visitorId) {
      visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('visitorId', visitorId);
    }
    
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="app loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="app">
      <Dashboard />
    </div>
  );
}

export default App;
