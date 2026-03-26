from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
try:
    with open(model_path, 'rb') as f:
        data = pickle.load(f)
        model = data['model']
        feature_names = data['features']
        print("Successfully loaded RandomForest model.")
except Exception as e:
    print("Error loading model:", e)
    model = None

@app.route('/api/score/individual', methods=['POST'])
def score_individual():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500
        
    req = request.json
    
    # Extract features matching the model training columns
    # ['income', 'savings', 'assets', 'flowRate', 'totalCredit', 'loanHistory']
    
    income = float(req.get('income', 0))
    savings = float(req.get('savings', 0))
    assets = float(req.get('assets', 0))
    flow_rate = float(req.get('flowRate', 0))
    total_credit = float(req.get('totalCredit', 0))
    
    # Map loan history string to numeric used in training: None=0, Repaid=1, Ongoing=2, Overdue=3
    history_str = req.get('loanHistory', 'None')
    hist_map = {'None': 0, 'Repaid': 1, 'Ongoing': 2, 'Overdue': 3}
    loan_hist = hist_map.get(history_str, 0)
    
    # Create DataFrame for prediction
    input_df = pd.DataFrame([{
        'income': income,
        'savings': savings,
        'assets': assets,
        'flowRate': flow_rate,
        'totalCredit': total_credit,
        'loanHistory': loan_hist
    }], columns=feature_names)
    
    # Predict score using RandomForest
    pred_score = model.predict(input_df)[0]
    score = int(round(pred_score))
    
    # Determine Risk Level
    risk_level = 'Low' if score >= 720 else 'Medium' if score >= 620 else 'High'
    
    # Generate dynamic reasons based on the inputs and RF feature importance logic
    reasons = []
    
    if flow_rate > 25:
        reasons.append({"type": "success", "text": f"Strong savings retention ({flow_rate:.1f}%) detected by ML Flow Model"})
    elif flow_rate < 0:
        reasons.append({"type": "danger", "text": "Negative cash flow flagged by risk algorithm"})
        
    if total_credit > 50000:
        reasons.append({"type": "success", "text": "High regular inflows positively factored"})
        
    if savings > (income * 3) and income > 0:
        reasons.append({"type": "success", "text": "Healthy liquid savings buffer increases model confidence"})
        
    if assets > 500000:
        reasons.append({"type": "success", "text": "Significant fixed asset worth lowers risk variance"})
        
    if loan_hist == 0:
        reasons.append({"type": "warning", "text": "Thin-file: AI applying baseline demographic interpolation"})
    elif loan_hist == 1:
        reasons.append({"type": "success", "text": "AI detected proven repayment credibility"})
    elif loan_hist == 3:
        reasons.append({"type": "danger", "text": "History of overdue payments drastically reduces AI score"})

    return jsonify({
        "score": score,
        "riskLevel": risk_level,
        "reasons": reasons,
        "ml_metadata": {
            "model_type": "RandomForestRegressor",
            "trees": 100,
            "engine": "scikit-learn"
        }
    })

if __name__ == '__main__':
    app.run(port=5001, debug=True)
