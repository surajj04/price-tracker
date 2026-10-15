import logging

from database import SessionLocal
from crud.product import fetch_stop_tracking, update_tracking
from crud.notification import push_new_notification
from schema.notification import NotificationCreate

logger = logging.getLogger(__name__)


def send_notification():
    db = SessionLocal()

    try:
        products = fetch_stop_tracking(db)

        for product in products:
            try:
                if product.discount_price is None:
                    continue

                if product.discount_price > float(product.target_price):
                    continue

                notification_data = NotificationCreate(
                    user_id=product.user_id,
                    target_price=product.target_price,
                    product_price=product.product_price,
                    title="Target Price Reached!",
                    message=(
                        f"{product.product_title} is now available "
                        f"for ₹{product.discount_price:,.2f}. "
                        f"Your target price was "
                        f"₹{float(product.target_price):,.2f}."
                    ),
                    type="price_drop",
                    is_read=False,
                    read_at=None,
                    action_url=f"/products/{product.id}",
                )

                push_new_notification(db, notification_data)
                result = update_tracking(db,product_id=product.id)

                logger.info(
                    "Notification created for product ID %s",
                    product.id,
                )

            except Exception:
                db.rollback()
                logger.exception(
                    "Failed to create notification for product ID %s",
                    product.id,
                )

    except Exception:
        db.rollback()
        logger.exception("Failed to fetch products for notifications")

    finally:
        db.close()