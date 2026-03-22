from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import models, schemas, auth, ml_services
from database import get_db
from pydantic import BaseModel

class ProductCreate(BaseModel):
    name: str
    type: str
    quantity: float
    certification_file_url: str | None = None
    price: float

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

class ProductResponse(BaseModel):
    id: int
    farmer_id: int
    farmer: PublicProfile
    name: str
    type: str
    quantity: float
    certification_status: str
    certification_file_url: str | None
    price: float
    predicted_price: float | None
    quality: str | None
    trace_id: str | None
    
    class Config:
        from_attributes = True

router = APIRouter(prefix="/products", tags=["products"])

@router.post("/", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can add products")

    certification_status = "Approved" if product.certification_file_url else "Pending"
    
    predicted_price = ml_services.predict_price(product.type, product.quantity, certification_status)
    quality = ml_services.predict_quality(size=2.5, moisture=12.0, millet_type=product.type) # mock inputs
    trace_id = ml_services.generate_traceability_hash(current_user.id, product.name, str(datetime.utcnow()))

    new_product = models.Product(
        farmer_id=current_user.id,
        name=product.name,
        type=product.type,
        quantity=product.quantity,
        certification_status=certification_status,
        certification_file_url=product.certification_file_url,
        price=product.price,
        predicted_price=predicted_price,
        quality=quality,
        trace_id=trace_id
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.get("/", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    products = db.query(models.Product).all()
    return products

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
