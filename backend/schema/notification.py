from pydantic import BaseModel
from datetime import datetime


class NotificationCreate(BaseModel):
    user_id: int
    target_price:float
    product_price:float
    title: str
    message: str
    type: str
    is_read: bool = False
    read_at: datetime | None = None
    action_url: str