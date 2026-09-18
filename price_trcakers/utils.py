import re


def parse_price(price_str):
    """
    '₹1,16,990.00' ya 'Not Found' jaisi string ko float me convert karta hai.
    Agar valid price na mile to None return karta hai.
    """
    if not price_str or price_str in ("Not found", "Not Found"):
        return None
    cleaned = re.sub(r"[^\d.]", "", price_str)
    if not cleaned:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None