import React from 'react';
import { BarChart2, User, FileText, TrendingUp, Clock, Trash2 } from 'lucide-react';

const HomePage = ({ user, onSelectMode, onViewHistory, onDeleteHistory }) => {
  const analyses = user.analyses || [];
  const bulkCount = analyses.filter(a => a.type === 'bulk').length;
  const indivCount = analyses.filter(a => a.type === 'individual').length;
  const lastDate = analyses.length > 0
    ? new Date(analyses[analyses.length - 1].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Never';

  return (
    <div className="page-enter">
      {/* Greeting */}
      <div className="home-greeting">
        <h1>Welcome back, {user.name.split(' ')[0]} 👋</h1>
        <p>Select an analysis mode to get started, or review your insights below.</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-card-label"><User size={13} style={{ marginRight: 4 }} />Account</div>
          <div className="summary-card-value" style={{ fontSize: '1.2rem', fontWeight: 700 }}>{user.name}</div>
          <div className="summary-card-sub">@{user.username}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label"><BarChart2 size={13} style={{ marginRight: 4 }} />Bulk Analyses</div>
          <div className="summary-card-value">{bulkCount}</div>
          <div className="summary-card-sub">CSV datasets processed</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label"><FileText size={13} style={{ marginRight: 4 }} />Individual Reports</div>
          <div className="summary-card-value">{indivCount}</div>
          <div className="summary-card-sub">Personal assessments</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label"><Clock size={13} style={{ marginRight: 4 }} />Last Analysis</div>
          <div className="summary-card-value" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{lastDate}</div>
          <div className="summary-card-sub">Most recent run</div>
        </div>
      </div>

      {/* Mode Selection */}
      <p className="mode-heading">Choose Analysis Mode</p>
      <div className="mode-grid">
        <button className="mode-card" onClick={() => onSelectMode('individual')}>
          <div className="mode-icon">👤</div>
          <div>
            <div className="mode-title">Individual Bank Statement</div>
            <div className="mode-desc">
              Upload a single person's bank transaction CSV or statement file. Get a personal credit analysis, spending breakdown, and risk score.
            </div>
          </div>
          <span className="tag tag-gray">Personal Analysis →</span>
        </button>

        <button className="mode-card" onClick={() => onSelectMode('bulk')}>
          <div className="mode-icon">📊</div>
          <div>
            <div className="mode-title">Bulk CSV Dataset</div>
            <div className="mode-desc">
              Upload a multi-user Kaggle-style CSV dataset. Analyze population-level credit trends, thin-file counts, and default rates.
            </div>
          </div>
          <span className="tag tag-gray">Population Analysis →</span>
        </button>
      </div>

      {/* Recent History */}
      {analyses.length > 0 && (
        <div className="panel">
          <div className="panel-title"><TrendingUp size={16} style={{ marginRight: 6 }} />Recent Activity</div>
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Mode</th>
                <th>Label</th>
                <th style={{ width: '40%' }}>Result</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...analyses].reverse().slice(0, 5).map((a, i) => (
                <tr key={i}>
                  <td>{new Date(a.date).toLocaleDateString()}</td>
                  <td><span className={`tag ${a.type === 'individual' ? 'tag-gray' : 'tag-gray'}`}>{a.type === 'individual' ? 'Individual' : 'Bulk'}</span></td>
                  <td>{a.label}</td>
                  <td>{a.summary}</td>
                  <td style={{ textAlign: 'right' }}>
                     <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', marginRight: '0.5rem' }} onClick={() => onViewHistory(a)}>View &rarr;</button>
                     <button className="btn btn-outline" style={{ padding: '0.4rem 0.6rem', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => { if(window.confirm('Delete this history record?')) onDeleteHistory(a.date); }}>
                        <Trash2 size={14} />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HomePage;
