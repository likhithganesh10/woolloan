import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

const AUTH_KEY = 'credit_users';
const SESSION_KEY = 'credit_session';

export const getUsers = () => JSON.parse(localStorage.getItem(AUTH_KEY) || '[]');
export const getSession = () => JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
export const saveSession = (user) => localStorage.setItem(SESSION_KEY, JSON.stringify(user));
export const clearSession = () => localStorage.removeItem(SESSION_KEY);

const LoginPage = ({ onLogin }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    const users = getUsers();
    const found = users.find(u => u.username === username && u.password === password);
    if (!found) { setError('Invalid username or password.'); return; }
    saveSession(found);
    onLogin(found);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !username.trim() || !password.trim()) {
      setError('All fields are required.'); return;
    }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    const users = getUsers();
    if (users.find(u => u.username === username)) {
      setError('Username already exists. Please choose another.'); return;
    }
    const newUser = { id: Date.now(), name: name.trim(), username: username.trim(), password, analyses: [] };
    localStorage.setItem(AUTH_KEY, JSON.stringify([...users, newUser]));
    saveSession(newUser);
    onLogin(newUser);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Credit<span>IQ</span></div>
        <p className="auth-subtitle">Credit scoring & risk analysis platform</p>

        <h2>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
          {mode === 'register' && (
            <div className="field">
              <label>Full Name</label>
              <div className="field-icon">
                <User size={16} className="icon" />
                <input type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            </div>
          )}
          <div className="field">
            <label>Username</label>
            <div className="field-icon">
              <User size={16} className="icon" />
              <input type="text" placeholder="Choose a username" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" />
            </div>
          </div>
          <div className="field">
            <label>Password</label>
            <div className="field-icon">
              <Lock size={16} className="icon" />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                style={{ paddingRight: '2.5rem' }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 0 }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-black" style={{ width: '100%', marginTop: '0.5rem' }}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
