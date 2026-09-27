from sqlalchemy import select
from sqlalchemy.orm import Session
from models.product import Product
from schema.product import ProductCreate

def get_products(db: Session):
    return db.scalars(select(Product)).all()

def get_product_by_user_id(db: Session,id:int):
    return db.scalars(select(Product).where(Product.user_id == id)).all()

def get_product_by_id(db: Session,id:int):
    return db.scalars(select(Product).where(Product.id == id)).one_or_none()

# def add_product(db: Session, product_data, user_id):
#     data = product_data['data']

#     product = Product(
#         user_id=user_id,
#         product_link=data['link'],
#         product_title=data['title'],
#         discount_price=data['discount_price'],
#         product_price=data['product_price'],
#         rating=data['rating'],
#         reviews=data['reviews'],
#         category=data['category'],
#         brand_or_manufacturer=data['additional_details'].get('Brand', 'Not Found'),
#         best_sellers_rank=data.get('best_sellers_rank', 'Not Found'),
#         product_details=data['details'],
#         additional_details=data['additional_details'],
#         platform=data['platform']
#     )

#     db.add(product)
#     db.commit()
#     db.refresh(product)

#     return product


def add_product(db:Session, product_data:ProductCreate):
    product = Product(
        user_id=product_data.user_id,
        product_link=product_data.product_link,
        product_title=product_data.product_title,
        targetPrice=product_data.targetPrice,
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
        push_notifications=product_data.push_notifications,
        check_frequency=product_data.check_frequency,
        platform=product_data.platform
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product
