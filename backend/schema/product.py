from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id:int
    product_link:str
    product_title: str
    targetPrice:float
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
    push_notifications:bool
    platform: str


class ProductCreate(BaseModel):
    user_id:int
    product_link:str
    product_title: str
    targetPrice:float
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
    push_notifications:bool
    platform: str
    check_frequency:str
