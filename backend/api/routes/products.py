from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from crud.product import (
    get_products,
    add_product,
    get_product_by_user_id,
    get_product_by_id,
    update_product,
    delete_product,
    get_product_by_link
)
from schema.product import ProductResponse, ProductCreate, ProductUpdate
from services.product_services import track_product

router = APIRouter(prefix="/product", tags=["Products"])


@router.get("/", response_model=list[ProductResponse])
def get_all_products(db: Session = Depends(get_db)):
    return get_products(db)


@router.post("/track/")
def track_products(product_link: str, db: Session = Depends(get_db)):
    existing =  get_product_by_link(db,product_link)

    if existing:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "You're already tracking this product.",
            },
        )

    response = track_product(product_link)

    if not response.get("status"):
        raise HTTPException(
            status_code=400,
            detail="Product link not valid or could not be scraped.",
        )
    
    return response


@router.post("/add-product/")
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    return add_product(db, product)


@router.patch("/update-product/{product_id}")
def update_products(
    product_id: int, product: ProductUpdate, db: Session = Depends(get_db)
):
    return update_product(db, product_id, product)

@router.delete("/delete-product/{product_id}")
def delete_products(product_id: int, db: Session = Depends(get_db)):
    return delete_product(db, product_id)


@router.get("/user/{user_id}", response_model=list[ProductResponse])
def get_products(user_id: int, db: Session = Depends(get_db)):
    return get_product_by_user_id(db, user_id)


@router.get("/detail/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    return get_product_by_id(db, product_id)
