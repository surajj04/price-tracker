"""
Ye file decide karti hai ki kaunsa scraper call karna hai (amazon ya flipkart),
aur uske RAW output ko ek COMMON format me convert karti hai:

    {
        "title": "...", "price": 1234.0,
        "rating": "...", "reviews": "...", "category": "...",
        "details": ..., "additional_details": {...}
    }

Ye conversion zaroori hai kyunki tumhare scrapers ka raw output
"product_price", "discount_price", "product_title" jaise keys deta hai,
lekin scheduler.py ko "price" / "title" chahiye. Agar ye conversion
skip kiya to scheduler ko price hamesha None milegi aur DB update nahi hoga.
"""

from price_trcakers.amazon import run_amazon_scraper
from price_trcakers.flipkart import run_flipkart_scraper
from price_trcakers.utils import parse_price


def _convert_amazon(raw: dict):
    if not raw:
        return None

    price_str = raw.get("discount_price")
    if not price_str or price_str == "Not found":
        price_str = raw.get("product_price")

    price = parse_price(price_str)
    if price is None:
        return None

    title = raw.get("product_title")
    if title == "Not found":
        title = None

    return {
        "title": title,
        "price": price,
        "rating": raw.get("product_rating"),
        "reviews": raw.get("product_reviews"),
        "category": raw.get("product_category"),
        "details": raw.get("product_details"),
        "additional_details": raw.get("additional_details"),
    }


def _convert_flipkart(raw: dict):
    if not raw:
        return None

    price_str = raw.get("discount_price")
    if not price_str or price_str == "Not Found":
        price_str = raw.get("product_price")

    price = parse_price(price_str)
    if price is None:
        return None

    title = raw.get("product_title")
    if title == "Not Found":
        title = None

    return {
        "title": title,
        "price": price,
        "rating": raw.get("product_rating"),
        "reviews": raw.get("product_reviews"),
        "category": raw.get("product_category"),
        "details": raw.get("product_details"),
        "additional_details": raw.get("additional_details"),
    }


def scrape_product(platform: str, url: str):
    try:
        if platform == "amazon":
            raw = run_amazon_scraper(url)
            return _convert_amazon(raw)
        elif platform == "flipkart":
            raw = run_flipkart_scraper(url)
            return _convert_flipkart(raw)
        else:
            return None
    except Exception as e:
        print(f"[Scraper Error] platform={platform} url={url} error={e}")
        return None