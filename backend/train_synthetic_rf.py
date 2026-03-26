import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import pickle
import os

print("Generating 10,000 synthetic banking profiles...")
np.random.seed(42)

n_samples = 10000
incomes = np.random.randint(20000, 150000, n_samples)
savings = incomes * np.random.uniform(0.5, 6.0, n_samples)
assets = incomes * np.random.uniform(0, 20.0, n_samples)
flowRates = np.random.normal(15, 20, n_samples) # -25 to +55 roughly
totalCredits = incomes * np.random.uniform(0.4, 1.2, n_samples)

# Loan history: None=0, Repaid=1, Ongoing=2, Overdue=3
loanHistories = np.random.choice([0, 1, 2, 3], n_samples, p=[0.4, 0.3, 0.2, 0.1])

data = pd.DataFrame({
    'income': incomes,
    'savings': savings,
    'assets': assets,
    'flowRate': flowRates,
    'totalCredit': totalCredits,
    'loanHistory': loanHistories
})

scores = []
for index, row in data.iterrows():
    s = 600
    if row['flowRate'] > 25:
        s += 50
    elif row['flowRate'] < 0:
        s -= 50
        
    if row['totalCredit'] > 50000:
        s += 30
        
    if row['income'] > 80000:
        s += 40
        
    if row['savings'] > (row['income'] * 3):
        s += 50
        
    if row['assets'] > 500000:
        s += 40
        
    if row['loanHistory'] == 0:
        s += 10 # None
    elif row['loanHistory'] == 1:
        s += 60 # Repaid
    elif row['loanHistory'] == 2:
        s += 20 # Ongoing
    elif row['loanHistory'] == 3:
        s -= 90 # Overdue
        
    # Add noise to make it realistic
    s += np.random.normal(0, 15)
    
    # Clip
    s = max(300, min(850, int(round(s))))
    scores.append(s)

data['score'] = scores

X = data.drop('score', axis=1)
y = data['score']

print("Training RandomForestRegressor model...")
rf_model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
rf_model.fit(X, y)

score = rf_model.score(X, y)
print(f"Training R^2 Score: {score:.4f}")

feature_importances = dict(zip(X.columns, rf_model.feature_importances_))
print("Feature Importances:", feature_importances)

model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
with open(model_path, 'wb') as f:
    pickle.dump({'model': rf_model, 'features': list(X.columns)}, f)
    
print(f"Model successfully saved to {model_path}!")
