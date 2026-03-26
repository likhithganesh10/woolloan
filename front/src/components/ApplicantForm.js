import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

const ApplicantForm = ({ onEvaluate, onBack }) => {
  const [formData, setFormData] = useState({
    loanAmount: '', duration: '', annualIncome: '', age: '', numCards: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => { e.preventDefault(); onEvaluate(formData); };

  const fields = [
    { name: 'loanAmount',    label: 'Requested Loan Amount ($)', placeholder: 'e.g. 15000', type: 'number' },
    { name: 'duration',      label: 'Duration (Months)',          placeholder: 'e.g. 36',    type: 'number' },
    { name: 'annualIncome',  label: 'Annual Income ($)',           placeholder: 'e.g. 65000', type: 'number' },
    { name: 'age',           label: 'Age',                        placeholder: 'e.g. 32',    type: 'number' },
    { name: 'numCards',      label: 'Active Credit Cards',        placeholder: 'e.g. 1',     type: 'number' },
  ];

  return (
    <div className="page-enter" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
        <button className="btn btn-outline" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Assess Individual Applicant</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Compare against the loaded population baseline</p>
        </div>
      </div>

      <div className="panel">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {fields.map(f => (
              <div className="field" key={f.name}>
                <label>{f.label}</label>
                <input
                  type={f.type}
                  name={f.name}
                  required
                  value={formData[f.name]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                />
              </div>
            ))}
          </div>
          <button id="tour-submit-btn" type="submit" className="btn btn-black" style={{ width: '100%', marginTop: '1.25rem' }}>
            Run Risk Assessment
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApplicantForm;
