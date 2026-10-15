from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id:int
    product_link:str
    product_image_link:str
    product_title: str
    target_price:float
    discount_price: float
    product_price: float
    rating: float
    reviews: str
    category: str
    brand_or_manufacturer: str
    best_sellers_rank: str | None = None
    product_details: list[str] | dict[str, Any] = Field(default_factory=dict)
    additional_details: dict[str, Any] = Field(default_factory=dict)
    check_frequency:str
    created_at: datetime
    email_alert:bool
    platform: str
    stop_tracking:bool = None


class ProductCreate(BaseModel):
    user_id:int
    product_link:str
    product_image_link:str
    product_title: str
    target_price:float
    discount_price: float
    product_price: float
    rating: float
    reviews: str
    category: str
    brand_or_manufacturer: str
    best_sellers_rank: str | None = None
    product_details: list[str] | dict[str, Any] = Field(default_factory=dict)
    additional_details: dict[str, Any] = Field(default_factory=dict)
    email_alert:bool
    platform: str
    check_frequency:str
    stop_tracking:bool = None


class ProductUpdate(BaseModel):
    user_id: Optional[int] = None
    product_link: Optional[str] = None
    product_image_link: Optional[str] = None
    product_title: Optional[str] = None
    target_price: Optional[float] = None
    discount_price: Optional[float] = None
    product_price: Optional[float] = None
    rating: Optional[float] = None
    reviews: Optional[str] = None
    category: Optional[str] = None
    brand_or_manufacturer: Optional[str] = None
    best_sellers_rank: Optional[str] = None
    product_details: Optional[list[str] | dict[str, Any]] = None
    additional_details: Optional[dict[str, Any]] = None
    email_alert: Optional[bool] = None
    push_notifications: Optional[bool] = None
    platform: Optional[str] = None
    check_frequency: Optional[str] = None
    stop_tracking:bool = None

class HistoryPriceCreate(BaseModel):
    product_id:int
    user_id:int
    product_link:str
    product_image_link:str
    product_title: str
    target_price:float
    discount_price: float
    product_price: float
    rating: float
    reviews: str
    category: str
    brand_or_manufacturer: str
    best_sellers_rank: str | None = None
    product_details: list[str] | dict[str, Any] = Field(default_factory=dict)
    additional_details: dict[str, Any] = Field(default_factory=dict)
    email_alert:bool
    platform: str
