import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestClassifier, IsolationForest
import hashlib

# Mock Datasets
# Price Prediction (Linear Regression)
# Features: Millet Type (encoded), Quantity, Certified (0/1)
price_X = np.array([
    [0, 100, 1],
    [1, 50, 0],
    [2, 200, 1],
    [0, 500, 0],
    [1, 10, 1]
])
price_y = np.array([36.0, 35.0, 48.0, 28.5, 42.0])
lr_model = LinearRegression().fit(price_X, price_y)

# Quality Prediction (Random Forest)
# Features: Size (mm), Moisture (%), Type (encoded)
quality_X = np.array([
    [2.5, 12.0, 0],
    [1.8, 15.0, 1],
    [3.0, 10.0, 2],
    [2.2, 11.5, 0],
    [1.5, 18.0, 1]
])
# Labels: 2 (High), 1 (Medium), 0 (Low)
quality_y = np.array([2, 0, 2, 1, 0])
rf_model = RandomForestClassifier(n_estimators=10, random_state=42).fit(quality_X, quality_y)

# Fraud Detection (Isolation Forest)
# Features: Purchase Frequency, Quantity, Amount
fraud_X = np.array([
    [5, 100, 3000],
    [10, 50, 1500],
    [2, 200, 6000],
    [20, 10, 300],
    [1, 5000, 150000] # Anomaly
])
iso_model = IsolationForest(contamination=0.2, random_state=42).fit(fraud_X)

def get_millet_encoded(millet_type: str) -> int:
    types = {"Pearl Millet": 0, "Finger Millet": 1, "Foxtail Millet": 2, "Sorghum": 3}
    return types.get(millet_type, 0)

def predict_price(millet_type: str, quantity: float, certification_status: str) -> float:
    type_enc = get_millet_encoded(millet_type)
    certified = 1 if certification_status == "Approved" else 0
    X_new = np.array([[type_enc, quantity, certified]])
    pred = lr_model.predict(X_new)[0]
    return round(max(0, pred), 2)

def predict_quality(size: float, moisture: float, millet_type: str) -> str:
    type_enc = get_millet_encoded(millet_type)
    X_new = np.array([[size, moisture, type_enc]])
    pred = rf_model.predict(X_new)[0]
    mapping = {2: "High", 1: "Medium", 0: "Low"}
    return mapping.get(pred, "Medium")

def detect_fraud(purchase_freq: int, quantity: float, amount: float) -> bool:
    X_new = np.array([[purchase_freq, quantity, amount]])
    pred = iso_model.predict(X_new)[0]
    # -1 is anomaly, 1 is normal
    return pred == -1

def generate_traceability_hash(farmer_id: int, product_name: str, timestamp: str) -> str:
    raw = f"{farmer_id}-{product_name}-{timestamp}"
    return hashlib.sha256(raw.encode()).hexdigest()

def calculate_trust_score(current_score: float, new_rating: float) -> float:
    # current_score out of 100. Rating out of 5.
    rating_score = (new_rating / 5.0) * 100
    updated_score = (current_score * 0.8) + (rating_score * 0.2)
    return round(updated_score, 2)
