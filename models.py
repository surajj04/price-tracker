from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

# Frequency ke naam -> minutes mapping (scheduler isko use karega)
FREQUENCY_MINUTES = {
    "15min": 15,
    "hourly": 60,
    "daily": 1440,
}

FREQUENCY_LABELS = {
    "15min": "Every 15 minutes",
    "hourly": "Hourly",
    "daily": "Daily",
}


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(1000), nullable=False)
    platform = db.Column(db.String(20), nullable=False)      # 'amazon' / 'flipkart'
    frequency = db.Column(db.String(20), nullable=False)     # '15min' / 'hourly' / 'daily'

    # ---- Latest scraped data (jo bhi scraper return karta hai, usko yahan store karte hain) ----
    title = db.Column(db.String(500), default="")
    rating = db.Column(db.String(50), default="")
    reviews = db.Column(db.String(50), default="")
    category = db.Column(db.String(300), default="")
    details_json = db.Column(db.Text, default="")             # scraper ka "details" field (list/dict) -> JSON string
    additional_details_json = db.Column(db.Text, default="")  # scraper ka "additional_details" field -> JSON string

    # ---- Price tracking ----
    current_price = db.Column(db.Float, nullable=True)
    lowest_price = db.Column(db.Float, nullable=True)
    last_checked = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    history = db.relationship(
        "PriceHistory", backref="product",
        cascade="all, delete-orphan", order_by="PriceHistory.checked_at.desc()"
    )
    notifications = db.relationship(
        "Notification", backref="product",
        cascade="all, delete-orphan", order_by="Notification.created_at.desc()"
    )

    @property
    def frequency_label(self):
        return FREQUENCY_LABELS.get(self.frequency, self.frequency)

    @property
    def details(self):
        """details_json ko wapas Python list/dict me convert karta hai (template me use karne ke liye)."""
        if not self.details_json:
            return None
        try:
            return json.loads(self.details_json)
        except (ValueError, TypeError):
            return None

    @property
    def additional_details(self):
        if not self.additional_details_json:
            return None
        try:
            return json.loads(self.additional_details_json)
        except (ValueError, TypeError):
            return None

    def update_from_scrape(self, result: dict):
        """
        Scraper se aaya poora result dict is Product record par apply karta hai.
        result format: {"title","price","rating","reviews","category","details","additional_details"}
        """
        if result.get("title"):
            self.title = result["title"]
        if result.get("rating"):
            self.rating = result["rating"]
        if result.get("reviews"):
            self.reviews = result["reviews"]
        if result.get("category"):
            self.category = result["category"]
        if result.get("details") is not None:
            self.details_json = json.dumps(result["details"], ensure_ascii=False)
        if result.get("additional_details") is not None:
            self.additional_details_json = json.dumps(result["additional_details"], ensure_ascii=False)


class PriceHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    price = db.Column(db.Float, nullable=False)
    checked_at = db.Column(db.DateTime, default=datetime.utcnow)


class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    kind = db.Column(db.String(20), default="drop")   # 'drop' / 'increase' / 'info'
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)