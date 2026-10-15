"""
Ye file decide karti hai ki kaunsa scraper call karna hai (amazon ya flipkart),
aur uske RAW output ko ek COMMON clean format me convert karti hai.

Scrapers ke raw output me:
    product_price
    discount_price
    product_title
    ...

COMMON output:
    title
    price
    product_price
    discount_price
    rating
    reviews
    category
    details
    additional_details

Price fields ko DB me bhejne se pehle parse_price() ke through
float me convert kiya jata hai.
"""

from scrapers.amazon import run_amazon_scraper
from scrapers.flipkart import run_flipkart_scraper
from scrapers.utils import parse_price


def _convert_amazon(raw: dict):
    if not raw:
        return None

    product_price = parse_price(raw.get("product_price"))
    discount_price = parse_price(raw.get("discount_price"))

    title = raw.get("product_title")

    if title and title.lower() in ("not found", "not found."):
        title = None

    # Current/selling price
    price = discount_price if discount_price is not None else product_price

    return {
        "link":raw.get("product_link"),
        "title": title,
        "image": raw.get("product_image"),
        "price": price,
        "product_price": product_price,
        "discount_price": discount_price,
        "rating": raw.get("product_rating"),
        "reviews": raw.get("product_reviews"),
        "category": raw.get("product_category"),
        "details": raw.get("product_details"),
        "additional_details": raw.get("additional_details"),
        "platform":raw.get("platform")
    }


def _convert_flipkart(raw: dict):
    if not raw:
        return None

    product_price = parse_price(raw.get("product_price"))
    discount_price = parse_price(raw.get("discount_price"))

    title = raw.get("product_title")

    if title and title.lower() in ("not found", "not found."):
        title = None

    # Current/selling price
    price = discount_price if discount_price is not None else product_price

    return {
        "link":raw.get("product_link"),
        "title": title,
        "image": raw.get("product_image"),
        "price": price,
        "product_price": product_price,
        "discount_price": discount_price,
        "rating": raw.get("product_rating"),
        "reviews": raw.get("product_reviews"),
        "category": raw.get("product_category"),
        "details": raw.get("product_details"),
        "additional_details": raw.get("additional_details"),
        "platform":raw.get("platform")
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
            print(f"[Scraper Error] Unsupported platform: {platform}")
            return None

    except Exception as e:
        print(
            f"[Scraper Error] "
            f"platform={platform} "
            f"url={url} "
            f"error={e}"
        )
        return None
