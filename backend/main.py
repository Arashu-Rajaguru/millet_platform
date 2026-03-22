from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routers import auth, products, uploads, transactions

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI-Driven Millet Value Chain Platform API")

# Setup CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Files for Uploads
import os
os.makedirs("uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# Include Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(uploads.router)
app.include_router(transactions.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI-Driven Millet Value Chain Platform API"}

# ML Entrypoints 
import ml_services

@app.get("/predict-price")
def get_predicted_price(millet_type: str, quantity: float, certification_status: str):
    price = ml_services.predict_price(millet_type, quantity, certification_status)
    return {"predicted_price": price}

@app.get("/predict-quality")
def get_predicted_quality(size: float, moisture: float, millet_type: str):
    quality = ml_services.predict_quality(size, moisture, millet_type)
    return {"quality": quality}

@app.get("/detect-fraud")
def get_fraud_detection(purchase_freq: int, quantity: float, amount: float):
    is_fraud = ml_services.detect_fraud(purchase_freq, quantity, amount)
    return {"is_fraudulent": is_fraud}
