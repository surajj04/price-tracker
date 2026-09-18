from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime

from models import db, Product, PriceHistory, Notification, FREQUENCY_MINUTES
from price_trcakers import scrape_product

scheduler = BackgroundScheduler()


def check_price(product_id: int, app):
    """
    Scheduler dwara call hota hai. Ye:
    1. Scraper call karta hai (poora data laata hai - title, price, rating, specs, etc.)
    2. Poora data Product record par save karta hai
    3. Naya price purane price se compare karta hai
    4. Price drop/increase par Notification banata hai
    5. PriceHistory table me price + timestamp save karta hai
    """
    with app.app_context():
        product = Product.query.get(product_id)
        if not product:
            return

        result = scrape_product(product.platform, product.url)
        if not result or result.get("price") is None:
            print(f"[Scheduler] Product {product_id}: scrape failed, skipping this run.")
            return

        new_price = float(result["price"])
        old_price = product.current_price

        # ---- poora scraped data (title, rating, reviews, category, specs) save karo ----
        product.update_from_scrape(result)

        # ---- price history entry ----
        db.session.add(PriceHistory(product_id=product.id, price=new_price))

        # ---- price comparison + notification ----
        if old_price is not None:
            if new_price < old_price:
                diff = old_price - new_price
                msg = (
                    f"🔻 Price dropped for \"{product.title or product.url}\": "
                    f"₹{old_price:.2f} → ₹{new_price:.2f} (saved ₹{diff:.2f})"
                )
                db.session.add(Notification(product_id=product.id, message=msg, kind="drop"))
            elif new_price > old_price:
                diff = new_price - old_price
                msg = (
                    f"🔺 Price increased for \"{product.title or product.url}\": "
                    f"₹{old_price:.2f} → ₹{new_price:.2f} (up by ₹{diff:.2f})"
                )
                db.session.add(Notification(product_id=product.id, message=msg, kind="increase"))

        # ---- price snapshot update ----
        product.current_price = new_price
        if product.lowest_price is None or new_price < product.lowest_price:
            product.lowest_price = new_price
        product.last_checked = datetime.utcnow()

        db.session.commit()
        print(f"[Scheduler] Product {product_id} checked. Price: {new_price}")


def schedule_product(product: Product, app):
    minutes = FREQUENCY_MINUTES.get(product.frequency, 60)
    scheduler.add_job(
        check_price,
        trigger="interval",
        minutes=minutes,
        args=[product.id, app],
        id=f"product_{product.id}",
        replace_existing=True,
        next_run_time=datetime.now(),  # add hote hi ek baar turant check kare
    )


def unschedule_product(product_id: int):
    job_id = f"product_{product_id}"
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)


def start_scheduler(app):
    if not scheduler.running:
        scheduler.start()

    with app.app_context():
        for product in Product.query.all():
            schedule_product(product, app)