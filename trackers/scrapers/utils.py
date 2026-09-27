import re


def parse_price(value):
    if value is None:
        return None

    value = str(value).strip()

    if not value or value.lower() in ("not found", "not found."):
        return None

    # Remove currency symbols and thousands separators
    value = value.replace(",", "")
    value = re.sub(r"[₹$€£]", "", value).strip()

    match = re.search(r"\d+(?:\.\d+)?", value)

    if not match:
        return None

    try:
        return float(match.group())
    except (ValueError, TypeError):
        return None
