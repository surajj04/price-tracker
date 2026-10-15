import logging
import time

from crud.product import fetch_check_freq_data, add_price_history, update_product, fetch_stop_tracking, delete_product
from database import SessionLocal
from services.product_services import track_product
from schema.product import HistoryPriceCreate, ProductUpdate
from services.push_notification import push_new_notification


logger = logging.getLogger(__name__)


def check_product_prices(interval: str):
    start_time = time.perf_counter()

    logger.info(
        "Price check started | interval=%s",
        interval,
    )

    db = SessionLocal()

    try:
        data = fetch_check_freq_data(db, interval)

        logger.info(
            "Products found | interval=%s | count=%d",
            interval,
            len(data),
        )

        success_count = 0
        failed_count = 0

        for product in data:

            logger.info(
                "Processing product | product_id=%s | title=%s",
                product.id,
                getattr(product, "product_title", "Unknown"),
            )

            try:
                product_latest_data = track_product(product.product_link)

                latest_data = product_latest_data["data"]

                logger.info(
                    "Product data fetched | product_id=%s | link=%s",
                    product.id,
                    product.product_link,
                )

                price_history = HistoryPriceCreate(
                    product_id=product.id,
                    user_id=product.user_id,
                    product_title=latest_data["title"],
                    product_link=latest_data["link"],
                    product_image_link=latest_data["image"],
                    target_price=product.target_price,
                    product_price=latest_data["product_price"],
                    discount_price=latest_data["discount_price"],
                    rating=latest_data["rating"],
                    reviews=latest_data["reviews"],
                    category=latest_data["category"],
                    brand_or_manufacturer=latest_data["additional_details"].get(
                        "Brand", "Not Found"
                    ),
                    best_sellers_rank="Not Found",
                    additional_details=latest_data["additional_details"],
                    product_details=latest_data["details"],
                    email_alert=product.email_alert,
                    push_notifications=product.push_notifications,
                    platform=latest_data["platform"],
                )

                add_price_history(
                    db,
                    price_history,
                )

                product_update = ProductUpdate(
                    **price_history.model_dump(exclude={"product_id"}),
                    check_frequency=product.check_frequency,
                    stop_tracking=product.stop_tracking
                )

                update_product(db, product.id, product_update)

                success_count += 1

                logger.info(
                    "Price history saved successfully | product_id=%s | price=%s",
                    product.id,
                    latest_data["product_price"],
                )

            except Exception:
                failed_count += 1

                logger.exception(
                    "Failed to process product | product_id=%s | link=%s",
                    product.id,
                    product.product_link,
                )

                continue

        elapsed = time.perf_counter() - start_time

        logger.info(
            "Price check completed | interval=%s | total=%d | success=%d | failed=%d | duration=%.2fs",
            interval,
            len(data),
            success_count,
            failed_count,
            elapsed,
        )

    except Exception:
        logger.exception(
            "Price check job failed | interval=%s",
            interval,
        )

    finally:
        db.close()

        logger.debug(
            "Database session closed | interval=%s",
            interval,
        )



def check_stop_tracking():
    db = SessionLocal()

    try:
        products = fetch_stop_tracking(db)

        for product in products:
            delete_product(db, product.id)

        logger.info(
            "Stop tracking job completed successfully. "
            "Processed %s products.",
            len(products),
        )
    except Exception:
        logger.exception(
            "Stop Tracking job failed",
        )
    finally:
        db.close()

        logger.debug(
            "Database session closed",
        )