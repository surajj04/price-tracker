from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from schema.user import RegisterUser, LoginUser
from crud.user import register_new_user, authenticate_user
from database import get_db

router = APIRouter(prefix="/user", tags=["Users"])


@router.get("/")
def get_users():
    return {"users": [{"id": 1, "name": "John doe", "email": "john.doe@example.com"}]}


@router.post("/register/")
def register_user(user: RegisterUser, db: Session = Depends(get_db)):
    return register_new_user(db, user)


@router.post("/login/")
def login_user(user: LoginUser, db: Session = Depends(get_db)):
    return authenticate_user(db, user)
