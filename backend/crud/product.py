from sqlalchemy import select, delete
from sqlalchemy.orm import Session
from models.product import Product, PriceHistory
from schema.product import ProductCreate, HistoryPriceCreate, ProductUpdate
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

def get_products(db: Session):
    return db.scalars(select(Product)).all()

def get_product_by_user_id(db: Session,id:int):
    return db.scalars(select(Product).where(Product.user_id == id)).all()

def get_product_by_link(db:Session, product_link:str):
    return db.scalars(select(Product).where(Product.product_link == product_link)).all()

def get_product_by_id(db: Session, id: int):
    stmt = (
        select(Product, PriceHistory)
        .outerjoin(
            PriceHistory,
            PriceHistory.product_id == Product.id
        )
        .where(Product.id == id)
    )

    rows = db.execute(stmt).all()

    if not rows:
        return None

    product = rows[0].Product

    price_history = [
        row.PriceHistory
        for row in rows
        if row.PriceHistory is not None
    ]

    return {
        "product": product,
        "price_history": price_history
    }

def add_product(db: Session, product_data: ProductCreate):
    product = Product(
        user_id=product_data.user_id,
        product_link=product_data.product_link,
        product_image_link=product_data.product_image_link,
        product_title=product_data.product_title,
        target_price=product_data.target_price,
        discount_price=product_data.discount_price,
        product_price=product_data.product_price,
        rating=product_data.rating,
        reviews=product_data.reviews,
        category=product_data.category,
        brand_or_manufacturer=product_data.brand_or_manufacturer,
        best_sellers_rank=product_data.best_sellers_rank or "Not Available",
        product_details=product_data.product_details,
        additional_details=product_data.additional_details,
        email_alert=product_data.email_alert,
        check_frequency=product_data.check_frequency,
        platform=product_data.platform,
        stop_tracking=product_data.stop_tracking,
    )

    db.add(product)

    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        # Distinguish between the different unique constraints if you have more than one
        if "product_product_link_key" in str(e.orig):
            raise HTTPException(
                status_code=409,
                detail="This product is already being tracked. Open it from your dashboard.",
            )
        raise HTTPException(
            status_code=409,
            detail="This product conflicts with an existing entry.",
        )

    db.refresh(product)
    return product


def update_product(db: Session, product_id: int, product_data: ProductUpdate):
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Only touch fields that were actually sent in the request body
    updates = product_data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)

    return product

def delete_product(db: Session, product_id: int):
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()

    return {"message": "Product deleted successfully"}
    

def add_price_history(db:Session, product_data:HistoryPriceCreate):
    product = PriceHistory(
        product_id=product_data.product_id,
        user_id=product_data.user_id,
        product_link=product_data.product_link,
        product_image_link=product_data.product_image_link,
        product_title=product_data.product_title,
        target_price=product_data.target_price,
        discount_price=product_data.discount_price,
        product_price=product_data.product_price,
        rating=product_data.rating,
        reviews=product_data.reviews,
        category=product_data.category,
        brand_or_manufacturer=product_data.brand_or_manufacturer,
        best_sellers_rank=product_data.best_sellers_rank or "Not Available",
        product_details=product_data.product_details,
        additional_details=product_data.additional_details,
        email_alert=product_data.email_alert,
        platform=product_data.platform
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product

def fetch_check_freq_data(db:Session, check_tf):
    return db.scalars(select(Product).where(Product.check_frequency==check_tf)).all()


def fetch_stop_tracking(db:Session):
    return db.scalars(select(Product).where(Product.stop_tracking == True, Product.target_price >=Product.discount_price, Product.push_notifications == False
                                            )).all()

def update_tracking(db: Session, product_id: int):
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.push_notifications = True

    db.flush()
    db.commit()

    db.refresh(product)

    return product