// creditScoring.js
// Utility to process Kaggle credit scoring datasets and extract metrics for thin-file users.

export const processCreditData = (data) => {
  if (!data || data.length === 0) return null;

  let totalUsers = data.length;
  let thinFileCount = 0;
  let totalCreditScore = 0;
  let defaultCount = 0;

  // Chart data aggregates
  let ageDistribution = { '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '55+': 0 };
  let creditCardCounts = { '0-1 Cards': 0, '2-3 Cards': 0, '4+ Cards': 0 };
  
  // Clean column names to make it case-insensitive and handle spaces
  const sampleRow = data[0];
  const colMap = {};
  Object.keys(sampleRow).forEach(key => {
    colMap[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = key;
  });

  const getVal = (row, possibleNames) => {
    for (const name of possibleNames) {
      if (colMap[name]) return row[colMap[name]];
    }
    return undefined;
  };

  data.forEach(row => {
    // Attempt to extract typical Kaggle columns
    const age = parseInt(getVal(row, ['age', 'customerage'])) || 30;
    const numCards = parseInt(getVal(row, ['numcreditcard', 'numberofcreditcards'])) || 0;
    const creditHistoryAge = getVal(row, ['credithistoryage', 'historyage']); // string or number
    const score = parseInt(getVal(row, ['creditscore'])) || 0;
    const isDefault = getVal(row, ['default', 'paymentofminamount', 'target', 'risk']) === 'Yes' || getVal(row, ['default']) === 1;

    // Thin file heuristic: 0-1 credit cards or short history
    let isThinFile = false;
    if (numCards <= 1) isThinFile = true;
    if (typeof creditHistoryAge === 'string' && creditHistoryAge.includes('Years')) {
       const years = parseInt(creditHistoryAge.split(' ')[0]);
       if (years < 2) isThinFile = true;
    }

    if (isThinFile) thinFileCount++;
    if (score > 0) totalCreditScore += score;
    if (isDefault) defaultCount++;

    // Age distribution
    if (age <= 25) ageDistribution['18-25']++;
    else if (age <= 35) ageDistribution['26-35']++;
    else if (age <= 45) ageDistribution['36-45']++;
    else if (age <= 55) ageDistribution['46-55']++;
    else ageDistribution['55+']++;

    // Cards distribution
    if (numCards <= 1) creditCardCounts['0-1 Cards']++;
    else if (numCards <= 3) creditCardCounts['2-3 Cards']++;
    else creditCardCounts['4+ Cards']++;
  });

  const ageData = Object.keys(ageDistribution).map(key => ({
    name: key,
    value: ageDistribution[key]
  }));

  const cardData = Object.keys(creditCardCounts).map(key => ({
    name: key,
    value: creditCardCounts[key]
  }));

  return {
    totalUsers,
    thinFileCount,
    thinFilePercent: ((thinFileCount / totalUsers) * 100).toFixed(1),
    avgCreditScore: totalCreditScore > 0 ? Math.round(totalCreditScore / totalUsers) : 'N/A',
    defaultRate: ((defaultCount / totalUsers) * 100).toFixed(1),
    charts: {
      ageData,
      cardData
    },
    raw: data // Keep raw data for comparison logic
  };
};

export const evaluateSingleApplicant = async (applicant, dataset) => {
  const reqAmount = parseFloat(applicant.loanAmount) || 0;
  const annualIncome = parseFloat(applicant.annualIncome) || 0;
  
  // DTI heuristic based on annual income
  const dti = annualIncome > 0 ? ((reqAmount / (applicant.duration || 12)) / (annualIncome / 12)) * 100 : 100; 

  const income = annualIncome / 12; // Monthly
  const savings = parseFloat(applicant.currentSavings) || 0;
  const assets = parseFloat(applicant.assets) || 0;
  const loanHistory = applicant.loanHistory || 'None';
  
  let aiScore = 600;
  let riskLevel = 'Medium';
  let factors = [];

  try {
     const res = await fetch('https://woolloan-1.onrender.com/api/score/individual', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
             income: income,
             savings: savings,
             assets: assets,
             loanHistory: loanHistory,
             flowRate: 15, // Baseline approximation for form-only entries
             totalCredit: income
         })
     });
     if (res.ok) {
         const data = await res.json();
         aiScore = data.score;
         riskLevel = data.riskLevel;
         // Map RF reasons format to Bulk 'factors' format
         if (data.reasons) {
             factors = data.reasons.map(r => ({ type: r.type, message: r.text }));
         }
     }
  } catch(e) { 
     console.error("AI API Error", e);
     factors.push({ type: 'danger', message: 'AI Backend offline, fallback metrics used.' });
  }

  // Translate 300-850 Random Forest scale back to 0-100 Bulk Scale visually
  // 850 = 0 risk, 300 = 100 risk
  let riskScore = Math.round(100 - ((aiScore - 300) / 550 * 100));
  riskScore = Math.max(0, Math.min(100, riskScore));

  let recommendation = 'Review Required';
  if (riskScore < 30) recommendation = 'Highly Likely to Approve';
  else if (riskScore < 60) recommendation = 'Potential to Approve (Manual AI Review)';
  else recommendation = 'High Risk - Likely Reject';

  if (dti > 40) factors.push({ type: 'warning', message: `High Structural Debt-to-Income Request (${dti.toFixed(1)}%)` });

  return {
    riskScore,
    recommendation,
    factors,
    dti: dti.toFixed(1)
  };
};
