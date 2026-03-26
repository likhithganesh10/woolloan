import React from 'react';
import { ShieldCheck, AlertOctagon, ArrowLeft, RefreshCw } from 'lucide-react';

const ApplicantReport = ({ applicant, result, onReset, onEdit, onBack }) => {
  if (!result) return null;
  const { riskScore, recommendation, factors, dti } = result;
  const isApproved = riskScore < 60;

  return (
    <div className="page-enter" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
        <button className="btn btn-outline" onClick={onBack}><ArrowLeft size={16} /> Dashboard</button>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Applicant Risk Report</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Comparison against loaded population baseline</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }} className="report-actions">
           <button className="btn btn-black" onClick={() => window.print()}>Download PDF</button>
           <button className="btn btn-outline" onClick={onReset}>
             <RefreshCw size={15} /> New Applicant
           </button>
           <button className="btn btn-ghost" onClick={onEdit}>Edit Parameters</button>
        </div>
      </div>

      {/* Decision Banner */}
      <div className="panel" style={{ textAlign: 'center', borderLeft: `4px solid ${isApproved ? 'var(--success)' : 'var(--danger)'}` }}>
        <div style={{ color: isApproved ? 'var(--success)' : 'var(--danger)', marginBottom: '0.75rem' }}>
          {isApproved ? <ShieldCheck size={48} /> : <AlertOctagon size={48} />}
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', color: isApproved ? 'var(--success)' : 'var(--danger)' }}>
          {recommendation}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>Risk Score: <strong style={{ color: 'var(--text)' }}>{riskScore} / 100</strong></p>
      </div>

      {/* Profile */}
      
      <div className="panel">
        <div className="panel-title">Applicant Profile</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Loan (₹)',       value: parseInt(applicant.loanAmount).toLocaleString() },
            { label: 'Income (₹)',     value: parseInt(applicant.annualIncome).toLocaleString() },
            { label: 'Savings (₹)',    value: parseInt(applicant.currentSavings).toLocaleString() },
            { label: 'Assets (₹)',     value: parseInt(applicant.assets).toLocaleString() },
            { label: 'Loan History', value: applicant.loanHistory },
            { label: 'Est. DTI',     value: `${dti}%` },
          ].map((item, i) => (
            <div key={i}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{item.label}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Factors */}
      <div className="panel">
        <div className="panel-title">Risk Factors Analysis</div>
        <div className="factors-list">
          {(factors || []).map((f, i) => (
            <div key={i} className={`factor-row ${f.type === 'success' ? 'factor-positive' : f.type === 'danger' ? 'factor-negative' : 'factor-neutral'}`}>
              <span>{f.message}</span>
              <span className={`tag ${f.type === 'success' ? 'tag-green' : f.type === 'danger' ? 'tag-red' : 'tag-yellow'}`}>
                {f.type === 'success' ? '✓ Good' : f.type === 'danger' ? '✗ Risk' : '⚠ Watch'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApplicantReport;
