import React, { useState } from 'react';
import Papa from 'papaparse';
import { parsePdfBankStatement } from '../utils/pdfParser';
import { UploadCloud, FileText, AlertCircle, ArrowLeft, TrendingUp, TrendingDown, Download, CheckCircle, Wallet, User, Briefcase, Info } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

// ── Enhanced analysis including ML Backend call ──
const analyseTransactions = async (rows, manualData) => {
  let totalCredit = 0, totalDebit = 0;
  const categories = {};
  const monthly = {};
  const transactions = [];

  // Parse transactions
  rows.forEach(row => {
    const rawAmount = parseFloat(row['Amount'] || row['amount'] || row['AMOUNT'] || row['Credit'] || row['credit'] || row['Debit'] || row['debit'] || 0);
    const typeRaw = (row['Type'] || row['type'] || row['Transaction Type'] || row['transaction_type'] || row['DR/CR'] || '').toString().toLowerCase();
    const description = row['Description'] || row['description'] || row['Narration'] || row['narration'] || row['Details'] || row['Particulars'] || 'Misc';
    const dateRaw = row['Date'] || row['date'] || row['VALUE DATE'] || row['Transaction Date'] || '';
    const creditAmt = parseFloat(row['Credit'] || row['credit'] || row['Credit Amount'] || row['Deposit'] || 0);
    const debitAmt  = parseFloat(row['Debit']  || row['debit']  || row['Debit Amount']  || row['Withdrawal'] || 0);

    let amount, isCredit;
    if (creditAmt > 0 || debitAmt > 0) {
      isCredit = creditAmt > 0;
      amount = isCredit ? creditAmt : debitAmt;
    } else {
      isCredit = typeRaw.includes('cr') || typeRaw.includes('credit') || typeRaw.includes('deposit') || rawAmount > 0;
      amount = Math.abs(rawAmount);
    }

    if (!amount || isNaN(amount)) return;
    if (isCredit) totalCredit += amount; else totalDebit += amount;

    const desc = description.toLowerCase();
    let cat = 'Other';
    if (/salary|income|credited/i.test(desc)) cat = 'Income';
    else if (/food|zomato|swiggy|restaurant|cafe|hotel/i.test(desc)) cat = 'Food';
    else if (/rent|housing|pg|lodging/i.test(desc)) cat = 'Housing';
    else if (/uber|ola|petrol|fuel|transport|metro|bus/i.test(desc)) cat = 'Transport';
    else if (/amazon|flipkart|shop|mart|store|purchase/i.test(desc)) cat = 'Shopping';
    else if (/emi|loan|credit card|repay/i.test(desc)) cat = 'EMI/Loan';
    if (!categories[cat]) categories[cat] = 0;
    categories[cat] += amount;

    const mo = dateRaw ? dateRaw.substring(0, 7) : 'Unknown';
    if (!monthly[mo]) monthly[mo] = { credit: 0, debit: 0 };
    if (isCredit) monthly[mo].credit += amount; else monthly[mo].debit += amount;
    transactions.push({ date: dateRaw, description, amount, isCredit, category: cat });
  });

  const savingsFlow = totalCredit - totalDebit;
  const flowRate = totalCredit > 0 ? (savingsFlow / totalCredit) * 100 : 0;
  
  // ── INTEGRATED ML SCORING (Python Random Forest) ──
  let score = 600;
  let riskLevel = 'Medium';
  let reasons = [];
  
  try {
     const res = await fetch('https://woolloan-1.onrender.com/api/score/individual', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
             income: manualData.monthlyIncome,
             savings: manualData.currentSavings,
             assets: manualData.assets,
             loanHistory: manualData.loanHistory,
             flowRate: flowRate,
             totalCredit: totalCredit
         })
     });
     if (res.ok) {
         const data = await res.json();
         score = data.score;
         riskLevel = data.riskLevel;
         reasons = data.reasons || [];
     } else {
         console.warn("ML API returned an error! Falling back to base score 600");
     }
  } catch(e) { 
     console.error("ML Backend failed, please check if Python Flask is running on port 5001", e);
     reasons = [{ type: 'danger', text: 'AI Backend offline. Default Risk Assigned.' }];
  }

  const monthlyArr = Object.entries(monthly).sort(([a], [b]) => a < b ? -1 : 1).slice(-6).map(([month, v]) => ({ month: month.replace(/^\d{4}-/, ''), ...v }));
  const catArr = Object.entries(categories).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value: Math.round(value) }));

  // ── LENDING CALCULATION ──
  const income = parseFloat(manualData.monthlyIncome || 0);
  const assets = parseFloat(manualData.assets || 0);
  const suggestedLimit = Math.round((income * 3) * (score / 600) + (assets * 0.05));
  const minDuration = score >= 720 ? '24 - 36 months' : score >= 620 ? '12 - 24 months' : '6 - 12 months';

  return { 
    totalCredit, totalDebit, savingsFlow, flowRate, 
    manualData, score, riskLevel, monthlyArr, catArr, reasons, 
    suggestedLimit, minDuration,
    transactions: transactions.slice(0, 50) 
  };
};

const fmt = (n) => '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const IndividualMode = ({ onBack, onSaveAnalysis, initialResult }) => {
  const [step, setStep] = useState(initialResult ? 'result' : 'form'); // form | upload | result
  const [manualData, setManualData] = useState({ monthlyIncome: '', currentSavings: '', assets: '', loanHistory: 'None' });
  const [result, setResult] = useState(initialResult || null);
  const [hasSaved, setHasSaved] = useState(!!initialResult);
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  
  const handleSave = () => {
    if (result && !hasSaved) {
      onSaveAnalysis({ type: 'individual', label: filename || 'Statement', date: new Date().toISOString(), summary: `ML Score ${result.score} · ${result.riskLevel} Risk`, payload: result });
      setHasSaved(true);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setStep('upload');
  };

  const handleFile = async (file) => {
    if (!file) return;
    const isCsv = file.name.endsWith('.csv');
    const isPdf = file.name.endsWith('.pdf');
    if (!isCsv && !isPdf) { setError('Please upload a CSV or PDF file.'); return; }
    
    setError(''); setLoading(true); setFilename(file.name);
    
    if (isPdf) {
      try {
        const rows = await parsePdfBankStatement(file);
        if (rows.length === 0) { setError('No legible transactions found in PDF.'); setLoading(false); return; }
        const analysis = await analyseTransactions(rows, manualData);
        setResult(analysis);
        setStep('result');
              } catch (err) {
        setLoading(false); setError('Error reading PDF file.');
      }
      setLoading(false);
    } else {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: async (results) => {
          if (!results.data || results.data.length === 0) { setError('CSV is empty.'); setLoading(false); return; }
          const analysis = await analyseTransactions(results.data, manualData);
          setResult(analysis);
          setStep('result');
                    setLoading(false);
        },
        error: () => { setLoading(false); setError('Error reading file.'); }
      });
    }
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="dashboard-header report-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={onBack}><ArrowLeft size={16} /> Back</button>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>AI Individual Assessment</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Powered by Random Forest ML algorithm</p>
          </div>
        </div>
      </div>

      {/* STEP 1: CONTEXT FORM */}
      {step === 'form' && (
        <div className="panel" style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={20} /> Step 1: Tell us about your finances</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem' }}>Provide context to improve the accuracy of our baseline modelling.</p>
          </div>
          <form onSubmit={handleFormSubmit}>
            <div className="field">
              <label>Monthly Gross Income (₹)</label>
              <input type="number" required value={manualData.monthlyIncome} onChange={e => setManualData({...manualData, monthlyIncome: e.target.value})} placeholder="e.g. 75000" />
            </div>
            <div className="field">
              <label>Current Savings (₹)</label>
              <input type="number" required value={manualData.currentSavings} onChange={e => setManualData({...manualData, currentSavings: e.target.value})} placeholder="e.g. 200000" />
            </div>
            <div className="field">
              <label>Total Fixed Assets / Gold / Property (₹ Value)</label>
              <input type="number" required value={manualData.assets} onChange={e => setManualData({...manualData, assets: e.target.value})} placeholder="e.g. 1500000" />
            </div>
            <div className="field">
              <label>Loan Repayment History</label>
              <select value={manualData.loanHistory} onChange={e => setManualData({...manualData, loanHistory: e.target.value})}>
                <option value="None">No previous loans (Thin File)</option>
                <option value="Repaid">Successfully repaid previous loans</option>
                <option value="Ongoing">On-time ongoing repayments</option>
                <option value="Overdue">History of delays or overdue payments</option>
              </select>
            </div>
            <button type="submit" className="btn btn-black" style={{ width: '100%', marginTop: '1rem' }}>Continue to Statement Upload →</button>
          </form>
        </div>
      )}

      {/* STEP 2: UPLOAD */}
      {step === 'upload' && (
        <div className="panel" style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><UploadCloud size={20} /> Step 2: Bank Statement (CSV/PDF)</h3>
            <button className="btn btn-ghost" onClick={() => setStep('form')} style={{ fontSize: '0.8rem' }}>Edit Info</button>
          </div>
          <div
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onClick={() => document.getElementById('ind-csv').click()}
          >
            <input type="file" id="ind-csv" accept=".csv,.pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
            {loading ? (
              <><FileText size={36} className="file-upload-icon" /><h3>Extracting & Contacting AI Backend...</h3></>
            ) : (
              <><UploadCloud size={36} /><h3>Drop bank statement (CSV/PDF) here</h3><span>We'll merge this file with your financial context</span></>
            )}
          </div>
          {error && <p style={{ color: 'var(--danger)', marginTop: '1rem' }}><AlertCircle size={16} /> {error}</p>}
        </div>
      )}

      {/* STEP 3: RESULT REPORT */}
      {step === 'result' && result && (
        <div id="printable-report">
          {/* Summary Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="metric-box" style={{ borderTop: `4px solid ${result.riskLevel === 'Low' ? 'var(--success)' : result.riskLevel === 'Medium' ? 'var(--warning)' : 'var(--danger)'}` }}>
              <div className="metric-box-label">AI Risk Score (RF)</div>
              <div className="metric-box-value" style={{ color: result.riskLevel === 'Low' ? 'var(--success)' : result.riskLevel === 'Medium' ? 'var(--warning)' : 'var(--danger)' }}>{result.score}</div>
              <span className={`tag ${result.riskLevel === 'Low' ? 'tag-green' : result.riskLevel === 'Medium' ? 'tag-yellow' : 'tag-red'}`}>{result.riskLevel} Risk Profile</span>
            </div>
            <div className="metric-box">
              <div className="metric-box-label">Monthly Gross Income</div>
              <div className="metric-box-value" style={{ fontSize: '1.4rem' }}>{fmt(result.manualData.monthlyIncome)}</div>
            </div>
            <div className="metric-box">
              <div className="metric-box-label">Declared Total Assets</div>
              <div className="metric-box-value" style={{ fontSize: '1.4rem' }}>{fmt(result.manualData.assets)}</div>
            </div>
            <div className="metric-box">
              <div className="metric-box-label">Statement Net Flow</div>
              <div className="metric-box-value" style={{ fontSize: '1.4rem', color: result.savingsFlow >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(result.savingsFlow)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="metric-box" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div className="metric-box-label">Suggested Lending Limit</div>
              <div className="metric-box-value" style={{ fontSize: '1.4rem', color: 'var(--accent)' }}>{fmt(result.suggestedLimit)}</div>
            </div>
            <div className="metric-box" style={{ borderLeft: '4px solid #6366f1' }}>
              <div className="metric-box-label">Min. Repayment Duration</div>
              <div className="metric-box-value" style={{ fontSize: '1.4rem' }}>{result.minDuration}</div>
            </div>
          </div>

          <div className="report-grid">
            {/* Analysis Results */}
            <div className="panel">
              <div className="panel-title">Statement Deep Dive</div>
              <div style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={result.monthlyArr} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#666', fontFamily: 'Saira' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#666', fontFamily: 'Saira' }} />
                    <Tooltip contentStyle={{ fontFamily: 'Saira', fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="credit" name="Cr" fill="#111111" radius={[2,2,0,0]} />
                    <Bar dataKey="debit" name="Dr" fill="#BBBBBB" radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <hr className="section-divider" />
              
              <div className="factors-list">
                {result.reasons && result.reasons.map((r, i) => (
                    <div key={i} className={`factor-row ${r.type === 'success' ? 'factor-positive' : r.type === 'danger' ? 'factor-negative' : 'factor-neutral'}`}>
                       <div><strong>AI Feature Importance:</strong> {r.text}</div>
                    </div>
                ))}
              </div>
            </div>

            {/* Assets & Worth */}
            <div className="panel">
              <div className="panel-title">Worth Portfolio</div>
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                 <Wallet size={48} style={{ color: 'var(--text-muted)' }} />
                 <div style={{ marginTop: '1rem', fontSize: '1.4rem', fontWeight: 800 }}>{fmt(result.manualData.assets)}</div>
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Net Asset Benchmark</div>
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    <span>Declared Savings</span>
                    <strong>{fmt(result.manualData.currentSavings)}</strong>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span>Income Stability</span>
                    <strong>High</strong>
                 </div>
              </div>
            </div>
          </div>

          <div className="report-actions" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button className="btn btn-black" onClick={handleSave} disabled={hasSaved}>{hasSaved ? 'Report Saved' : 'Save Report'}</button>
            <button className="btn btn-black" onClick={() => window.print()}><Download size={16} /> Download Report (PDF)</button>
            <button className="btn btn-outline" onClick={() => { setStep('form'); setResult(null); setHasSaved(false); }}>Start New Analysis</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndividualMode;
