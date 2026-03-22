from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String)  # 'farmer', 'buyer', 'admin'
    trust_score = Column(Float, default=50.0)

    # Extended Profile Data
    contact_number = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    preferences = Column(String, nullable=True)

    products = relationship("Product", back_populates="farmer")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    type = Column(String, index=True)
    quantity = Column(Float)
    certification_status = Column(String, default="Pending")
    certification_file_url = Column(String, nullable=True)
    price = Column(Float)
    predicted_price = Column(Float, nullable=True)
    quality = Column(String, nullable=True)
    trace_id = Column(String, unique=True, index=True, nullable=True)

    farmer = relationship("User", back_populates="products")
    transactions = relationship("Transaction", back_populates="product")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    amount = Column(Float)
    quantity = Column(Float)
    status = Column(String, default="Completed")
    is_fraudulent = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    buyer = relationship("User")
    product = relationship("Product", back_populates="transactions")

class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    target_user_id = Column(Integer, ForeignKey("users.id"))
    rater_user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Float)
