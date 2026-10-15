from database import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, Double, TIMESTAMP, Boolean, JSON, func
from datetime import datetime

class User(Base):
    __tablename__ = "user"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, nullable=False)
    name:Mapped[str] = mapped_column(String, nullable=False)
    email:Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash:Mapped[str] = mapped_column(String, nullable=False)
    created_at:Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now(),nullable=False)
    updated_at:Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now(),nullable=False)

