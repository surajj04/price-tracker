from database import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, Double, TIMESTAMP, Boolean, JSON, func
from datetime import datetime


class Notification(Base):
    __tablename__ = "notification"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, nullable=False)
    user_id:Mapped[int] = mapped_column(Integer, nullable=False)
    target_price:Mapped[float] = mapped_column(Double,nullable=False)
    product_price:Mapped[float] = mapped_column(Double, nullable=False)
    title:Mapped[str] = mapped_column(String, nullable=False)
    message:Mapped[str] = mapped_column(String, nullable=False)
    type:Mapped[str] = mapped_column(String, nullable=False)
    is_read:Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at:Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
    read_at:Mapped[datetime] = mapped_column(TIMESTAMP, nullable=True, default=None)
    action_url:Mapped[str] = mapped_column(String, nullable=False)

