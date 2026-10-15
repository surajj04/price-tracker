from apscheduler.schedulers.background import BlockingScheduler
from apscheduler.schedulers.background import BackgroundScheduler


from task.track_product_task import check_product_prices, check_stop_tracking
from services.push_notification import send_notification

scheduler = BackgroundScheduler()


def start_scheduler():
    if scheduler.running:
        return

    scheduler.add_job(
        send_notification,
        "interval",
        seconds=20,
        id="send_notification",
        replace_existing=True,
    )

    scheduler.add_job(
        check_product_prices,
        "interval",
        minutes=15,
        args=["15m"],
        id="check_15m",
        replace_existing=True,
    )
    scheduler.add_job(
        check_product_prices,
        "interval",
        minutes=30,
        args=["30m"],
        id="check_30m",
        replace_existing=True,
    )
    scheduler.add_job(
        check_product_prices,
        "interval",
        hours=1,
        args=["1h"],
        id="check_1h",
        replace_existing=True,
    )
    scheduler.add_job(
        check_product_prices,
        "interval",
        hours=2,
        args=["2h"],
        id="check_2h",
        replace_existing=True,
    )
    scheduler.add_job(
        check_product_prices,
        "interval",
        hours=6,
        args=["6h"],
        id="check_6h",
        replace_existing=True,
    )
    scheduler.add_job(
        check_product_prices,
        "interval",
        hours=12,
        args=["12h"],
        id="check_12h",
        replace_existing=True,
    )
    scheduler.add_job(
        check_product_prices,
        "interval",
        hours=24,
        args=["24h"],
        id="check_24h",
        replace_existing=True,
    )

    scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
