import React, { useState, useEffect } from 'react';
import LoginPage, { getSession, clearSession, getUsers } from './components/LoginPage';
import HomePage from './components/HomePage';
import IndividualMode from './components/IndividualMode';
import BulkMode from './components/BulkMode';
import WizardHelper from './components/WizardHelper';

const AUTH_KEY = 'credit_users';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home');
  const [historyData, setHistoryData] = useState(null);
  const [toast, setToast] = useState(null);

  // Restore session on load
  useEffect(() => {
    const session = getSession();
    if (session) setUser(session);
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLogin = (u) => {
    setUser(u);
    showToast(`Welcome back, ${u.name}!`, 'success');
    setView('home');
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setView('home');
    showToast('Signed out successfully.', 'info');
  };


  const handleDeleteAnalysis = (timestamp) => {
    const users = JSON.parse(localStorage.getItem(AUTH_KEY) || '[]');
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) return;
    if (users[idx].analyses) {
      users[idx].analyses = users[idx].analyses.filter(a => a.date !== timestamp);
      localStorage.setItem(AUTH_KEY, JSON.stringify(users));
      setUser({ ...users[idx] });
      showToast('Analysis deleted.', 'info');
    }
  };
  
  // Persist an analysis record to the user's history
  const handleSaveAnalysis = (record) => {
    const users = JSON.parse(localStorage.getItem(AUTH_KEY) || '[]');
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) return;
    if (!users[idx].analyses) users[idx].analyses = [];
    users[idx].analyses.push(record);
    localStorage.setItem(AUTH_KEY, JSON.stringify(users));
    setUser({ ...users[idx] });
  };

  // Wizard context messages
  let wizardMessage = '';
  if (!user) wizardMessage = 'Welcome to CreditIQ! Sign in or register to start analysing credit data.';
  else if (view === 'home') wizardMessage = `Hi ${user.name.split(' ')[0]}! Choose a mode: Individual for personal bank statements, or Bulk for large datasets.`;
  else if (view === 'individual') wizardMessage = "Upload a CSV bank statement. I'll detect columns automatically and generate a personal credit analysis.";
  else if (view === 'bulk') wizardMessage = 'Upload a multi-user CSV dataset. Then use "Assess Applicant" to compare someone against the population.';

  // Not authenticated — show login
  if (!user) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        {toast && (
          <div className="toast-container">
            <div className={`toast ${toast.type}`}>{toast.msg}</div>
          </div>
        )}
        <WizardHelper message={wizardMessage} isVisible={true} />
      </>
    );
  }

  return (
    <div className="app-shell">
      {/* Navbar */}
      <nav className="app-nav">
        <span className="nav-brand">Credit<span>IQ</span></span>
        <div className="nav-right">
          <span className="nav-user">{user.name}</span>
          {view !== 'home' && (
            <button className="btn btn-outline" onClick={() => setView('home')}>Home</button>
          )}
          <button className="btn btn-ghost" onClick={handleLogout}>Sign out</button>
        </div>
      </nav>

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>{toast.msg}</div>
        </div>
      )}

      {/* Main content */}
      <main className="app-main">
        {view === 'home' && (
          <HomePage
            user={user}
            onSelectMode={(mode) => {
              setView(mode);
              showToast(mode === 'individual' ? 'Individual mode activated' : 'Bulk mode activated', 'info');
            }}
            onViewHistory={(record) => {
              setHistoryData(record);
              setView('history_' + record.type);
            }}
            onDeleteHistory={handleDeleteAnalysis}
          />
        )}
        {view === 'individual' && (
          <IndividualMode
            onBack={() => setView('home')}
            user={user}
            onSaveAnalysis={handleSaveAnalysis}
          />
        )}
        {view === 'history_individual' && historyData && (
          <IndividualMode
            onBack={() => setView('home')}
            user={user}
            onSaveAnalysis={() => {}}
            initialResult={historyData.payload}
          />
        )}
        {view === 'bulk' && (
          <BulkMode
            onBack={() => setView('home')}
            onSaveAnalysis={handleSaveAnalysis}
          />
        )}
        {view === 'history_bulk' && historyData && (
          <BulkMode
            onBack={() => setView('home')}
            onSaveAnalysis={() => {}}
            initialMetrics={historyData.payload}
          />
        )}
      </main>

      {/* Floating Wizard */}
      <WizardHelper message={wizardMessage} isVisible={true} />
    </div>
  );
}

export default App;
