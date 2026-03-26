import React, { useState } from 'react';
import Papa from 'papaparse';
import { UploadCloud, FileText, AlertCircle, ArrowLeft, UserPlus } from 'lucide-react';
import { processCreditData, evaluateSingleApplicant } from '../utils/creditScoring';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import ApplicantForm from './ApplicantForm';
import ApplicantReport from './ApplicantReport';

const COLORS = ['#111111', '#555555', '#888888', '#BBBBBB', '#333333'];

const BulkMode = ({ onBack, onSaveAnalysis }) => {
  const [step, setStep] = useState('upload'); // upload | dashboard | form | report
  const [metrics, setMetrics] = useState(null);
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [currentApplicant, setCurrentApplicant] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) { setError('Please upload a CSV file.'); return; }
    setError('');
    setLoading(true);
    setFilename(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setLoading(false);
        if (!results.data || results.data.length === 0) { setError('CSV appears empty.'); return; }
        const m = processCreditData(results.data);
        setMetrics(m);
        setStep('dashboard');
        onSaveAnalysis({ type: 'bulk', label: file.name, date: new Date().toISOString(), summary: `${m.totalUsers.toLocaleString()} profiles · ${m.thinFilePercent}% thin-file` });
      },
      error: () => { setLoading(false); setError('Error reading the file.'); }
    });
  };

  const handleEvaluate = (data) => {
    setCurrentApplicant(data);
    const r = evaluateSingleApplicant(data, metrics.raw);
    setEvalResult(r);
    setStep('report');
  };

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn btn-outline" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Bulk CSV Dataset Analysis</h2>
          {metrics && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{filename} &nbsp;·&nbsp; {metrics.totalUsers.toLocaleString()} profiles loaded</p>}
        </div>
        {step === 'dashboard' && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-black" onClick={() => setStep('form')}><UserPlus size={16} /> Assess Applicant</button>
            <button className="btn btn-outline" onClick={() => { setStep('upload'); setMetrics(null); }}>New Dataset</button>
          </div>
        )}
      </div>

      {/* UPLOAD */}
      {step === 'upload' && (
        <div className="panel">
          <div
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onClick={() => document.getElementById('bulk-csv').click()}
          >
            <input type="file" id="bulk-csv" accept=".csv" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
            {loading ? (
              <><FileText size={36} style={{ color: 'var(--text-muted)' }} /><h3>Processing dataset...</h3><span>Analysing all rows, please wait</span></>
            ) : (
              <><UploadCloud size={36} style={{ color: 'var(--text-muted)' }} /><h3>Drag &amp; Drop your multi-user CSV</h3><span>Kaggle credit dataset or any multi-row credit file</span></>
            )}
          </div>
          {error && <p style={{ color: 'var(--danger)', marginTop: '1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><AlertCircle size={16} />{error}</p>}
        </div>
      )}

      {/* DASHBOARD */}
      {step === 'dashboard' && metrics && (
        <>
          <div className="metrics-grid">
            <div className="metric-box">
              <div className="metric-box-label">Total Profiles</div>
              <div className="metric-box-value">{metrics.totalUsers.toLocaleString()}</div>
            </div>
            <div className="metric-box">
              <div className="metric-box-label">Thin-File Users</div>
              <div className="metric-box-value">{metrics.thinFileCount.toLocaleString()}</div>
              <span className="tag tag-yellow">{metrics.thinFilePercent}%</span>
            </div>
            <div className="metric-box">
              <div className="metric-box-label">Avg Credit Score</div>
              <div className="metric-box-value">{metrics.avgCreditScore}</div>
            </div>
            <div className="metric-box">
              <div className="metric-box-label">Default Rate</div>
              <div className="metric-box-value" style={{ color: parseFloat(metrics.defaultRate) > 15 ? 'var(--danger)' : 'var(--text)' }}>{metrics.defaultRate}%</div>
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-panel">
              <div className="chart-panel-title">Age Distribution</div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.charts.ageData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#555', fontFamily: 'Saira' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#555', fontFamily: 'Saira' }} />
                  <Tooltip contentStyle={{ fontFamily: 'Saira', fontSize: 12, borderRadius: 6 }} />
                  <Bar dataKey="value" fill="#111111" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-panel">
              <div className="chart-panel-title">Credit Card Allocation</div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics.charts.cardData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                    {metrics.charts.cardData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: 'Saira', fontSize: 12, borderRadius: 6 }} />
                  <Legend wrapperStyle={{ fontFamily: 'Saira', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ASSESS FORM */}
      {step === 'form' && (
        <ApplicantForm onEvaluate={handleEvaluate} onBack={() => setStep('dashboard')} />
      )}

      {/* REPORT */}
      {step === 'report' && evalResult && (
        <ApplicantReport
          applicant={currentApplicant}
          result={evalResult}
          onReset={() => setStep('form')}
          onBack={() => setStep('dashboard')}
        />
      )}
    </div>
  );
};

export default BulkMode;
