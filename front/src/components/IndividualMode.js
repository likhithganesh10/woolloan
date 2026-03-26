import React, { useState } from 'react';
import Papa from 'papaparse';
import { UploadCloud, FileText, AlertCircle, ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

// ── Analyse a single person's bank transactions ──
const analyseTransactions = (rows) => {
  let totalCredit = 0, totalDebit = 0;
  const categories = {};
  const monthly = {};
  const transactions = [];

  rows.forEach(row => {
    // Try multiple common column name patterns
    const rawAmount =
      parseFloat(row['Amount'] || row['amount'] || row['AMOUNT'] ||
        row['Credit'] || row['credit'] || row['Debit'] || row['debit'] || 0);

    const typeRaw = (row['Type'] || row['type'] || row['Transaction Type'] ||
      row['transaction_type'] || row['DR/CR'] || '').toString().toLowerCase();

    const description = row['Description'] || row['description'] ||
      row['Narration'] || row['narration'] || row['Details'] || row['Particulars'] || 'Misc';

    const dateRaw = row['Date'] || row['date'] || row['VALUE DATE'] || row['Transaction Date'] || '';

    const creditAmt = parseFloat(row['Credit'] || row['credit'] || row['Credit Amount'] || row['Deposit'] || 0);
    const debitAmt  = parseFloat(row['Debit']  || row['debit']  || row['Debit Amount']  || row['Withdrawal'] || 0);

    let amount, isCredit;
    if (creditAmt > 0 || debitAmt > 0) {
      // Has separate credit/debit columns
      isCredit = creditAmt > 0;
      amount = isCredit ? creditAmt : debitAmt;
    } else {
      isCredit = typeRaw.includes('cr') || typeRaw.includes('credit') || typeRaw.includes('deposit') || rawAmount > 0;
      amount = Math.abs(rawAmount);
    }

    if (!amount || isNaN(amount)) return;

    if (isCredit) totalCredit += amount;
    else totalDebit += amount;

    // Categorise by description keywords
    const desc = description.toLowerCase();
    let cat = 'Other';
    if (/salary|income|credited/i.test(desc)) cat = 'Income';
    else if (/food|zomato|swiggy|restaurant|cafe|hotel/i.test(desc)) cat = 'Food';
    else if (/rent|housing|pg|lodging/i.test(desc)) cat = 'Housing';
    else if (/uber|ola|petrol|fuel|transport|metro|bus/i.test(desc)) cat = 'Transport';
    else if (/amazon|flipkart|shop|mart|store|purchase/i.test(desc)) cat = 'Shopping';
    else if (/emi|loan|credit card|repay/i.test(desc)) cat = 'EMI/Loan';
    else if (/insurance|lic|policy/i.test(desc)) cat = 'Insurance';
    else if (/utility|electricity|bill|postpaid|broadband|gas/i.test(desc)) cat = 'Utilities';
    else if (/upi|transfer|neft|imps|rtgs/i.test(desc)) cat = 'Transfers';

    if (!categories[cat]) categories[cat] = 0;
    categories[cat] += amount;

    // Monthly grouping
    const mo = dateRaw ? dateRaw.substring(0, 7) : 'Unknown';
    if (!monthly[mo]) monthly[mo] = { credit: 0, debit: 0 };
    if (isCredit) monthly[mo].credit += amount;
    else monthly[mo].debit += amount;

    transactions.push({ date: dateRaw, description, amount, isCredit, category: cat });
  });

  const savings = totalCredit - totalDebit;
  const savingsRate = totalCredit > 0 ? (savings / totalCredit) * 100 : 0;
  const dti = totalCredit > 0 ? ((categories['EMI/Loan'] || 0) / totalCredit) * 100 : 0;

  // Credit score heuristic (300-850)
  let score = 650;
  if (savingsRate > 30) score += 60;
  else if (savingsRate > 15) score += 30;
  else if (savingsRate < 0) score -= 80;

  if (dti > 40) score -= 60;
  else if (dti > 20) score -= 20;
  else if (dti < 10) score += 30;

  if (totalCredit > 50000) score += 20;
  score = Math.max(300, Math.min(850, score));

  const monthlyArr = Object.entries(monthly)
    .sort(([a], [b]) => a < b ? -1 : 1)
    .slice(-6)
    .map(([month, values]) => ({ month: month.replace(/^\d{4}-/, ''), ...values }));

  const catArr = Object.entries(categories)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value: Math.round(value) }));

  const riskLevel = score >= 700 ? 'Low' : score >= 580 ? 'Medium' : 'High';

  return { totalCredit, totalDebit, savings, savingsRate, dti, score, riskLevel, monthlyArr, catArr, transactions: transactions.slice(0, 50) };
};

const fmt = (n) => '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const COLORS = ['#111111', '#555555', '#888888', '#BBBBBB', '#333333', '#777777', '#AAAAAA'];

const IndividualMode = ({ onBack, user, onSaveAnalysis }) => {
  const [step, setStep] = useState('upload'); // upload | result
  const [result, setResult] = useState(null);
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
        if (!results.data || results.data.length === 0) {
          setError('CSV appears empty or unreadable.'); return;
        }
        const analysis = analyseTransactions(results.data);
        setResult(analysis);
        setStep('result');
        onSaveAnalysis({
          type: 'individual',
          label: file.name,
          date: new Date().toISOString(),
          summary: `Score ${analysis.score} · ${analysis.riskLevel} Risk`
        });
      },
      error: () => { setLoading(false); setError('Error reading the file.'); }
    });
  };

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn btn-outline" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Individual Bank Statement Analysis</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Upload a personal transaction CSV to get a credit analysis</p>
        </div>
      </div>

      {step === 'upload' && (
        <div className="panel">
          <div
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onClick={() => document.getElementById('ind-csv').click()}
          >
            <input type="file" id="ind-csv" accept=".csv" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
            {loading ? (
              <>
                <FileText size={36} style={{ color: 'var(--text-muted)' }} />
                <h3>Analysing transactions...</h3>
                <span>Please wait</span>
              </>
            ) : (
              <>
                <UploadCloud size={36} style={{ color: 'var(--text-muted)' }} />
                <h3>Drag &amp; Drop your bank statement CSV</h3>
                <span>or click to browse files &nbsp;·&nbsp; Supports most bank export formats</span>
              </>
            )}
          </div>
          {error && <p style={{ color: 'var(--danger)', marginTop: '1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><AlertCircle size={16} />{error}</p>}

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-off)', borderRadius: 'var(--radius)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text)' }}>Supported columns (any combination):</strong>
            <br />Date, Description / Narration, Amount, Credit, Debit, Type, Transaction Type, DR/CR
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <>
          {/* Score + summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="metric-box">
              <div className="metric-box-label">Estimated Credit Score</div>
              <div className="metric-box-value" style={{ color: result.score >= 700 ? 'var(--success)' : result.score >= 580 ? 'var(--warning)' : 'var(--danger)' }}>{result.score}</div>
              <span className={`tag ${result.riskLevel === 'Low' ? 'tag-green' : result.riskLevel === 'Medium' ? 'tag-yellow' : 'tag-red'}`}>{result.riskLevel} Risk</span>
            </div>
            <div className="metric-box">
              <div className="metric-box-label">Total Income</div>
              <div className="metric-box-value" style={{ fontSize: '1.5rem' }}>{fmt(result.totalCredit)}</div>
            </div>
            <div className="metric-box">
              <div className="metric-box-label">Total Spending</div>
              <div className="metric-box-value" style={{ fontSize: '1.5rem' }}>{fmt(result.totalDebit)}</div>
            </div>
            <div className="metric-box">
              <div className="metric-box-label">Net Savings</div>
              <div className="metric-box-value" style={{ fontSize: '1.5rem', color: result.savings >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {result.savings >= 0 ? <TrendingUp size={18} style={{ marginRight: 4 }} /> : <TrendingDown size={18} style={{ marginRight: 4 }} />}
                {fmt(result.savings)}
              </div>
            </div>
            <div className="metric-box">
              <div className="metric-box-label">Savings Rate</div>
              <div className="metric-box-value" style={{ fontSize: '1.5rem' }}>{result.savingsRate.toFixed(1)}%</div>
            </div>
            <div className="metric-box">
              <div className="metric-box-label">Debt-to-Income</div>
              <div className="metric-box-value" style={{ fontSize: '1.5rem', color: result.dti > 40 ? 'var(--danger)' : 'var(--text)' }}>{result.dti.toFixed(1)}%</div>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-row">
            <div className="chart-panel">
              <div className="chart-panel-title">Monthly Cash Flow</div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.monthlyArr} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#555' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#555' }} tickFormatter={v => '₹' + (v/1000).toFixed(0) + 'k'} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ fontFamily: 'Saira', fontSize: 12, borderRadius: 6 }} />
                  <Bar dataKey="credit" name="Income" fill="#111111" radius={[3,3,0,0]} />
                  <Bar dataKey="debit"  name="Spending" fill="#BBBBBB" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-panel">
              <div className="chart-panel-title">Spending Categories</div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.catArr.slice(0, 7)} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#555' }} tickFormatter={v => '₹' + (v/1000).toFixed(0) + 'k'} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#333' }} width={50} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ fontFamily: 'Saira', fontSize: 12, borderRadius: 6 }} />
                  <Bar dataKey="value" fill="#111111" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Factors */}
          <div className="panel" style={{ marginBottom: '1.5rem' }}>
            <div className="panel-title">Credit Risk Factors</div>
            <div className="factors-list">
              {[
                { label: 'Savings Rate', value: `${result.savingsRate.toFixed(1)}%`, good: result.savingsRate >= 20, bad: result.savingsRate < 5, note: result.savingsRate >= 20 ? 'Excellent savings discipline' : result.savingsRate < 5 ? 'Very low savings — high risk indicator' : 'Moderate savings rate' },
                { label: 'Debt-to-Income Ratio', value: `${result.dti.toFixed(1)}%`, good: result.dti <= 20, bad: result.dti > 40, note: result.dti > 40 ? 'High DTI — elevated default risk' : result.dti <= 20 ? 'Healthy debt burden' : 'Moderate obligations' },
                { label: 'Total Income', value: fmt(result.totalCredit), good: result.totalCredit > 30000, bad: result.totalCredit < 5000, note: result.totalCredit > 30000 ? 'Strong income base' : 'Low income — limited repayment capacity' },
                { label: 'Net Cash Flow', value: fmt(result.savings), good: result.savings > 0, bad: result.savings < 0, note: result.savings < 0 ? 'Spending exceeds income — negative cash flow' : 'Positive cash flow' },
              ].map((f, i) => (
                <div key={i} className={`factor-row ${f.good ? 'factor-positive' : f.bad ? 'factor-negative' : 'factor-neutral'}`}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{f.label}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>{f.note}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Table */}
          <div className="panel">
            <div className="panel-title">Recent Transactions <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.85rem' }}>(first 50 rows)</span></div>
            <div style={{ overflowX: 'auto' }}>
              <table className="transaction-table">
                <thead>
                  <tr><th>Date</th><th>Description</th><th>Category</th><th style={{ textAlign: 'right' }}>Amount</th></tr>
                </thead>
                <tbody>
                  {result.transactions.map((t, i) => (
                    <tr key={i}>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{t.date}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                      <td><span className="tag tag-gray">{t.category}</span></td>
                      <td className={t.isCredit ? 'amount-credit' : 'amount-debit'} style={{ textAlign: 'right' }}>
                        {t.isCredit ? '+' : '−'}{fmt(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-outline" onClick={() => { setStep('upload'); setResult(null); }}>Analyse Another Statement</button>
            <button className="btn btn-black" onClick={onBack}>Back to Home</button>
          </div>
        </>
      )}
    </div>
  );
};

export default IndividualMode;
