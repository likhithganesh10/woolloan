import React, { useState } from 'react';
import { UserPlus, Briefcase, CreditCard, DollarSign, Calendar } from 'lucide-react';

const ApplicantForm = ({ onEvaluate, onBack }) => {
  const [formData, setFormData] = useState({
    loanAmount: '',
    duration: '',
    annualIncome: '',
    age: '',
    numCards: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onEvaluate(formData);
  };

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
      <div className="dashboard-header">
        <div>
          <h2>Evaluate New Applicant</h2>
          <p style={{ color: 'var(--text-muted)' }}>Enter the applicant's details below to compare against the risk model.</p>
        </div>
        <button className="btn btn-outline" onClick={onBack}>
          Back to Dashboard
        </button>
      </div>

      <form onSubmit={handleSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 className="text-gradient">Loan Request Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Requested Amount ($)</label>
            <div style={{ position: 'relative' }}>
              <DollarSign size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <input 
                type="number" 
                name="loanAmount"
                required
                value={formData.loanAmount}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', background: 'rgba(15,23,42,0.02)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                placeholder="e.g. 15000"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Duration (Months)</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <input 
                type="number" 
                name="duration"
                required
                value={formData.duration}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', background: 'rgba(15,23,42,0.02)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                placeholder="e.g. 36"
              />
            </div>
          </div>
        </div>

        <h3 className="text-gradient">Personal & Financial Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Annual Income ($)</label>
            <div style={{ position: 'relative' }}>
              <Briefcase size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <input 
                type="number" 
                name="annualIncome"
                required
                value={formData.annualIncome}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', background: 'rgba(15,23,42,0.02)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                placeholder="e.g. 65000"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Age</label>
            <div style={{ position: 'relative' }}>
              <UserPlus size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <input 
                type="number" 
                name="age"
                required
                value={formData.age}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', background: 'rgba(15,23,42,0.02)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                placeholder="e.g. 32"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Active Credit Cards</label>
            <div style={{ position: 'relative' }}>
              <CreditCard size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <input 
                type="number" 
                name="numCards"
                required
                value={formData.numCards}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', background: 'rgba(15,23,42,0.02)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                placeholder="e.g. 1"
              />
            </div>
          </div>

        </div>

        <button id="tour-submit-btn" type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
          Run Model Assessment
        </button>
      </form>
    </div>
  );
};

export default ApplicantForm;
