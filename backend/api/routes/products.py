from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from crud.product import get_products, add_product, get_product_by_user_id, get_product_by_id
from schema.product import ProductResponse, ProductCreate
from services.product_services import track_product


router = APIRouter(prefix="/product",tags=['Products'])


@router.get("/", response_model=list[ProductResponse])
def get_all_products(db: Session = Depends(get_db)):
    return get_products(db)

@router.post('/track/')
def add_products(product_link:str, db:Session = Depends(get_db)):
    response = track_product(product_link)
    if response['status']:
        return response
    else:
        return {"Product Link Not Valid"}

@router.post('/add-product/')
def add_products(product:ProductCreate, db:Session = Depends(get_db)):
    print("📥 RECEIVED:", product.model_dump()) 
    return add_product(db, product)


@router.get('/user/{user_id}',response_model=list[ProductResponse])
def get_products(user_id:int,db:Session = Depends(get_db)):
    return get_product_by_user_id(db,user_id)

@router.get('/detail/{product_id}')
def get_product(product_id:int, db:Session = Depends(get_db)):
    return get_product_by_id(db, product_id)
