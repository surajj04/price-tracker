from sqlalchemy import String, Integer, Double, JSON, TIMESTAMP, Boolean, DateTime, func
from database import Base
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime


class Product(Base):
    __tablename__ = "product"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    product_link:Mapped[str] = mapped_column(String, nullable=False, unique=True)
    product_image_link:Mapped[str] = mapped_column(String, nullable=False)
    product_title: Mapped[str] = mapped_column(String, nullable=False)
    target_price : Mapped[str] = mapped_column(Double,nullable=False)
    discount_price: Mapped[float] = mapped_column(Double)
    product_price: Mapped[float] = mapped_column(Double)
    rating: Mapped[float] = mapped_column(Double)
    reviews: Mapped[str] = mapped_column(String(20))
    category: Mapped[str] = mapped_column(String(255))
    brand_or_manufacturer: Mapped[str] = mapped_column(String(255))
    best_sellers_rank: Mapped[str] = mapped_column(String(255))
    product_details: Mapped[str] = mapped_column(JSON)
    additional_details: Mapped[str] = mapped_column(JSON)
    check_frequency:Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP,server_default=func.now(),nullable=False)
    email_alert:Mapped[bool] = mapped_column(Boolean,nullable=False,default=False)
    push_notifications:Mapped[bool] = mapped_column(Boolean,nullable=False,default=False)
    platform: Mapped[str] = mapped_column(String(255))
    stop_tracking:Mapped[bool] = mapped_column(Boolean)


class PriceHistory(Base):
    __tablename__ = "price_history"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, nullable=False)
    product_id:Mapped[int] = mapped_column(Integer, nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    product_link:Mapped[str] = mapped_column(String, nullable=False)
    product_image_link:Mapped[str] = mapped_column(String, nullable=False)
    product_title: Mapped[str] = mapped_column(String, nullable=False)
    target_price : Mapped[str] = mapped_column(Double,nullable=False)
    discount_price: Mapped[float] = mapped_column(Double)
    product_price: Mapped[float] = mapped_column(Double)
    rating: Mapped[float] = mapped_column(Double)
    reviews: Mapped[str] = mapped_column(String(20))
    category: Mapped[str] = mapped_column(String(255))
    brand_or_manufacturer: Mapped[str] = mapped_column(String(255))
    best_sellers_rank: Mapped[str] = mapped_column(String(255))
    product_details: Mapped[str] = mapped_column(JSON)
    additional_details: Mapped[str] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP,server_default=func.now(),nullable=False)
    email_alert:Mapped[bool] = mapped_column(Boolean,nullable=False,default=False)
    push_notifications:Mapped[bool] = mapped_column(Boolean,nullable=False,default=False)
    platform: Mapped[str] = mapped_column(String(255))
