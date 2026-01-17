import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, LogIn, UserPlus, LayoutDashboard, LogOut, Sparkles, BarChart3, Clock, BookOpen } from 'lucide-react';

import '../styles/Landing.css';

function Landing() {
  const navigate = useNavigate();

  const auth = useMemo(() => {
    try {
      const token = localStorage.getItem('token');
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      return { token, user };
    } catch {
      return { token: null, user: null };
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <div className="landing">
      <div className="landing-shell">
        <header className="landing-nav">
          <div className="brand">
            <div className="brand-badge">
              <Award size={20} />
            </div>
            <div className="brand-title">Win GATE</div>
          </div>

          <div className="nav-actions">
            {auth.token ? (
              <>
                <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                  <LayoutDashboard size={18} />
                  Dashboard
                </button>
                <button className="btn btn-ghost" onClick={handleLogout}>
                  <LogOut size={18} />
                  Logout{auth.user?.name ? ` (${auth.user.name})` : ''}
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-ghost" onClick={() => navigate('/login')}>
                  <LogIn size={18} />
                  Login
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/signup')}>
                  <UserPlus size={18} />
                  Sign Up
                </button>
              </>
            )}
          </div>
        </header>

        <main className="landing-main">
          <section className="hero">
            <div>
              <div className="hero-kicker">
                <Sparkles size={16} />
                One dashboard for your GATE prep
              </div>

              <h1 className="hero-title">
                Study smarter.
                <br />
                Track consistently.
                <br />
                <span>Win GATE.</span>
              </h1>

              <p className="hero-subtitle">
                Win GATE helps you stay on track with curriculum progress and daily study hours.
                Build momentum with a clean workflow designed for serious preparation.
              </p>

              <div className="hero-cta">
                {auth.token ? (
                  <>
                    <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                      <LayoutDashboard size={18} />
                      Open Dashboard
                    </button>
                    <button className="btn btn-ghost" onClick={handleLogout}>
                      <LogOut size={18} />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-primary" onClick={() => navigate('/signup')}>
                      <UserPlus size={18} />
                      Get Started
                    </button>
                    <button className="btn btn-ghost" onClick={() => navigate('/login')}>
                      <LogIn size={18} />
                      I already have an account
                    </button>
                  </>
                )}
              </div>
            </div>

            <aside className="hero-panel">
              <div className="hero-panel-title">What you get</div>
              <p className="hero-panel-desc">
                A fast, distraction-free workspace that turns daily effort into visible progress.
              </p>

              <div className="stats">
                <div className="stat">
                  <div className="stat-value">Daily</div>
                  <div className="stat-label">Study hours tracking</div>
                </div>
                <div className="stat">
                  <div className="stat-value">Clean</div>
                  <div className="stat-label">Curriculum checklist</div>
                </div>
                <div className="stat">
                  <div className="stat-value">Simple</div>
                  <div className="stat-label">Progress insights</div>
                </div>
              </div>
            </aside>
          </section>

          <section className="features">
            <div className="feature-card">
              <div className="feature-icon">
                <Clock size={18} />
              </div>
              <div className="feature-title">Log study hours in seconds</div>
              <div className="feature-desc">
                Quickly record daily hours and keep your streaks honest. Small consistency beats big bursts.
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <BookOpen size={18} />
              </div>
              <div className="feature-title">Follow a structured curriculum</div>
              <div className="feature-desc">
                Break down preparation into topics and tick them off with clarity. No more guessing “what next?”.
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <BarChart3 size={18} />
              </div>
              <div className="feature-title">See progress, stay motivated</div>
              <div className="feature-desc">
                Understand your effort over time and adjust your plan early—before you fall behind.
              </div>
            </div>
          </section>

          <footer className="footer">
            <div>© {new Date().getFullYear()} Win GATE</div>
            <div>
              <a href="#" onClick={(e) => e.preventDefault()}>
                Built for focused preparation
              </a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default Landing;
