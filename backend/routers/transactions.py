from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, auth, ml_services
from database import get_db
from pydantic import BaseModel

class TransactionCreate(BaseModel):
    product_id: int
    quantity: float

from datetime import datetime

class PublicProfile(BaseModel):
    id: int
    name: str
    contact_number: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    trust_score: float

    class Config:
        from_attributes = True

class ProductBasicInfo(BaseModel):
    id: int
    name: str
    type: str

    class Config:
        from_attributes = True

class TransactionResponse(BaseModel):
    id: int
    buyer_id: int
    product_id: int
    amount: float
    quantity: float
    status: str
    is_fraudulent: bool
    timestamp: datetime
    buyer: PublicProfile
    product: ProductBasicInfo
    
    class Config:
        from_attributes = True

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.post("/", response_model=TransactionResponse)
def create_transaction(tx: TransactionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "buyer" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only buyers can purchase products")

    product = db.query(models.Product).filter(models.Product.id == tx.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.quantity < tx.quantity:
        raise HTTPException(status_code=400, detail="Not enough quantity available")
        
    amount = product.price * tx.quantity
    
    # Fraud Detection mock logic
    user_tx_count = db.query(models.Transaction).filter(models.Transaction.buyer_id == current_user.id).count()
    is_fraudulent = ml_services.detect_fraud(purchase_freq=user_tx_count, quantity=tx.quantity, amount=amount)
    
    new_tx = models.Transaction(
        buyer_id=current_user.id,
        product_id=tx.product_id,
        amount=amount,
        quantity=tx.quantity,
        is_fraudulent=is_fraudulent
    )
    
    product.quantity -= tx.quantity
    
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    return new_tx

@router.get("/", response_model=List[TransactionResponse])
def get_transactions(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role == "buyer":
        return db.query(models.Transaction).filter(models.Transaction.buyer_id == current_user.id).all()
    elif current_user.role == "farmer":
        return db.query(models.Transaction).join(models.Product).filter(models.Product.farmer_id == current_user.id).all()
    else:
        return db.query(models.Transaction).all()
