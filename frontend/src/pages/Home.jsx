import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, RotateCcw, Moon, Sun, TrendingUp, CheckCircle, RefreshCw, Clock, BarChart3, Award, RotateCw, LogIn, UserPlus, LogOut, UserCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Curriculum from './Curriculum';
import { studyHoursAPI } from '../services/api';
import '../styles/Dashboard.css';

function Dashboard() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeSection, setActiveSection] = useState('curriculum');
  const [authUser, setAuthUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [dailyHours, setDailyHours] = useState(0);
  const [studyHoursData, setStudyHoursData] = useState(Array(31).fill(0));
  const [syncing, setSyncing] = useState(false);
  const navigate = useNavigate();

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  useEffect(() => {
    const loadAuthUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setAuthUser(null);
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/auth/me', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          setAuthUser(null);
          return;
        }

        const data = await response.json().catch(() => null);
        if (data) {
          setAuthUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        } else {
          setAuthUser(null);
        }
      } catch (e) {
        setAuthUser(null);
      }
    };

    loadAuthUser();
  }, []);

  useEffect(() => {
    const initData = async () => {
      try {
        // Then load month data
        await loadMonthData();
      } catch (error) {
        console.log('Dashboard initialization failed:', error);
      }
    };
    initData();
  }, [selectedMonth]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthUser(null);
    navigate('/');
  };

  const isLoggedIn = Boolean(authUser && localStorage.getItem('token'));

  const loadMonthData = async () => {
    const year = new Date().getFullYear();
    const month = selectedMonth + 1;
    
    try {
      const response = await studyHoursAPI.getMonthData(month, year);
      const records = response?.data?.data || [];
      const newData = Array(31).fill(0);
      records.forEach((record) => {
        newData[record.day - 1] = record.hours;
      });
      setStudyHoursData(newData);
      return;
    } catch (error) {
      console.log('Backend load failed:', error);
    }

    setStudyHoursData(Array(31).fill(0));
  };

  const getMonthData = () => {
    const daysCount = daysInMonth[selectedMonth];
    return Array.from({ length: daysCount }, (_, i) => ({
      day: i + 1,
      hours: parseFloat(studyHoursData[i]).toFixed(1)
    }));
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setDailyHours(parseFloat(studyHoursData[day - 1]) || 0);
  };

  const handleHourChange = (hours) => {
    const validHours = Math.max(0, Math.min(9, parseFloat(hours) || 0));
    setDailyHours(validHours);
  };

  const saveDayHours = async () => {
    if (selectedDay !== null) {
      const year = new Date().getFullYear();
      const month = selectedMonth + 1;
      
      // Update local state immediately for instant UI response
      const newData = [...studyHoursData];
      newData[selectedDay - 1] = dailyHours;
      setStudyHoursData(newData);
      
      // Sync to backend
      setSyncing(true);
      try {
        await studyHoursAPI.saveDayHours(month, year, selectedDay, dailyHours);
      } catch (error) {
        console.error('Error syncing to backend:', error);
      } finally {
        setSyncing(false);
      }
      
      setSelectedDay(null);
      setDailyHours(0);
    }
  };

  const getMonthStats = () => {
    const monthData = getMonthData();
    const totalHours = monthData.reduce((sum, d) => sum + parseFloat(d.hours), 0);
    const avgHours = monthData.length > 0 ? (totalHours / monthData.length).toFixed(1) : 0;
    const targetHours = monthData.length * 7;
    const progress = targetHours > 0 ? Math.round((totalHours / targetHours) * 100) : 0;
    return { totalHours: totalHours.toFixed(1), avgHours, progress };
  };

  return (
    <div className={`dashboard ${darkMode ? 'dark' : 'light'}`}>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-left">
            <div className="logo-group">
              <Award className="logo-icon" />
              <Award className="logo-icon" />
            </div>
            <div>
             {/* <button onClick={()=>navigate('/')}>
              </button> */}
              <h1>Win GATE - Study Tracker</h1>
              <p>Track Your Daily Study Hours</p>
            </div>
          </div>

          <div className="header-right">
            <button onClick={() => setDarkMode(!darkMode)} className="theme-btn">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {isLoggedIn ? (
              <div className="auth-buttons">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-login"
                  title="Your account"
                >
                  <UserCircle size={18} />
                  {authUser?.name || authUser?.email || 'Account'}
                </button>
                <button
                  onClick={handleLogout}
                  className="btn-signup"
                  title="Logout"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button 
                  onClick={() => navigate('/login')} 
                  className="btn-login"
                  title="Login to your account"
                >
                  <LogIn size={18} />
                  Login
                </button>
                <button 
                  onClick={() => navigate('/signup')} 
                  className="btn-signup"
                  title="Create a new account"
                >
                  <UserPlus size={18} />
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="nav-tabs">
          <button 
            onClick={() => setActiveSection('curriculum')}
            className={`nav-tab ${activeSection === 'curriculum' ? 'active' : ''}`}
          >
            <BookOpen size={20} />
            Curriculum
          </button>
          <button 
            onClick={() => setActiveSection('studyHours')}
            className={`nav-tab ${activeSection === 'studyHours' ? 'active' : ''}`}
          >
            <Clock size={20} />
            Study Hours
          </button>
        </div>

        {activeSection === 'curriculum' && (
          <Curriculum darkMode={darkMode} />
        )}

        {activeSection === 'studyHours' && (
          <div className="study-section">
            <div className="section-header">
              <div>
                <h2>Study Hours Tracker</h2>
                <p>Log your daily study hours with decimal support</p>
              </div>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="month-dropdown"
              >
                {months.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
            </div>

            <div className="stats-grid">
              <div className="stat">
                <BarChart3 className="stat-icon" />
                <div>
                  <p>Total Hours</p>
                  <p className="stat-value">{getMonthStats().totalHours}h</p>
                </div>
              </div>
              <div className="stat">
                <Clock className="stat-icon" />
                <div>
                  <p>Daily Avg</p>
                  <p className="stat-value">{getMonthStats().avgHours}h</p>
                </div>
              </div>
              <div className="stat">
                <TrendingUp className="stat-icon" />
                <div>
                  <p>Progress</p>
                  <p className="stat-value">{getMonthStats().progress}%</p>
                </div>
              </div>
            </div>

            <div className="calendar">
              <h3>📅 {months[selectedMonth]} Calendar</h3>
              <div className="calendar-grid">
                {getMonthData().map((data) => (
                  <button
                    key={data.day}
                    onClick={() => handleDayClick(data.day)}
                    className={`day-btn ${selectedDay === data.day ? 'selected' : ''} ${parseFloat(data.hours) > 0 ? 'logged' : ''}`}
                  >
                    <span className="day-num">{data.day}</span>
                    <span className="day-hours">{data.hours !== '0.0' ? `${data.hours}h` : '-'}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedDay !== null && (
              <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <h3>Log Hours for Day {selectedDay}</h3>
                  <div className="input-group">
                    <label>Study Hours (0.0 - 9.9)</label>
                    <div className="decimal-input">
                      <button onClick={() => handleHourChange(Math.max(0, dailyHours - 0.1))}>−</button>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="9.9"
                        value={dailyHours.toFixed(1)}
                        onChange={(e) => handleHourChange(parseFloat(e.target.value) || 0)}
                      />
                      <button onClick={() => handleHourChange(Math.min(9.9, dailyHours + 0.1))}>+</button>
                    </div>
                    <p className="display">{dailyHours.toFixed(1)} hours</p>
                  </div>
                  <div className="modal-actions">
                    <button onClick={saveDayHours} className="btn-save">Save</button>
                    <button onClick={() => setSelectedDay(null)} className="btn-cancel">Cancel</button>
                  </div>
                </div>
              </div>
            )}

            <div className="chart-container">
              <h3>📈 Trending Graph - {months[selectedMonth]}</h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={getMonthData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#444' : '#e0e0e0'} />
                  <XAxis dataKey="day" stroke={darkMode ? '#888' : '#666'} />
                  <YAxis domain={[0, 10]} stroke={darkMode ? '#888' : '#666'} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: darkMode ? '#222' : '#fff',
                      border: `1px solid ${darkMode ? '#444' : '#ccc'}`
                    }}
                    formatter={(value) => `${value}h`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
