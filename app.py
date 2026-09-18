from flask import Flask, render_template, request, flash, redirect, url_for
from urllib.parse import urlparse

from models import db, Product, Notification, FREQUENCY_MINUTES
from scheduler import start_scheduler, schedule_product, unschedule_product

app = Flask(__name__)
app.secret_key = "change-this-secret-key"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///price_tracker.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

with app.app_context():
    db.create_all()

start_scheduler(app)


def detect_platform(url: str):
    netloc = urlparse(url).netloc.lower()
    if "amazon." in netloc:
        return "amazon"
    elif "flipkart." in netloc:
        return "flipkart"
    return None


@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")


@app.route("/track", methods=["POST"])
def track():
    url = request.form.get("product_url", "").strip()
    frequency = request.form.get("frequency", "hourly")

    if not url:
        flash("Please enter a URL.", "error")
        return redirect(url_for("home"))

    if frequency not in FREQUENCY_MINUTES:
        frequency = "hourly"

    platform = detect_platform(url)
    if platform is None:
        flash("Only Amazon and Flipkart URLs are supported right now.", "error")
        return redirect(url_for("home"))

    product = Product(url=url, platform=platform, frequency=frequency)
    db.session.add(product)
    db.session.commit()

    # is product ke liye scheduler job register karo (turant + recurring)
    schedule_product(product, app)

    flash(
        f"Tracking started for {platform.upper()} product! "
        f"Checking every: {product.frequency_label}",
        "success",
    )
    return redirect(url_for("dashboard"))


@app.route("/dashboard")
def dashboard():
    products = Product.query.order_by(Product.created_at.desc()).all()
    unread_count = Notification.query.filter_by(is_read=False).count()
    return render_template("dashboard.html", products=products, unread_count=unread_count)


@app.route("/product/<int:product_id>")
def product_detail(product_id):
    product = Product.query.get_or_404(product_id)
    return render_template("product_detail.html", product=product)


@app.route("/product/<int:product_id>/delete", methods=["POST"])
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    unschedule_product(product.id)
    db.session.delete(product)
    db.session.commit()
    flash("Product removed from tracking.", "success")
    return redirect(url_for("dashboard"))


@app.route("/notifications")
def notifications():
    items = Notification.query.order_by(Notification.created_at.desc()).all()
    # sab ko read mark kar do jab page khule
    for n in items:
        n.is_read = True
    db.session.commit()
    return render_template("notifications.html", notifications=items)


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)  # use_reloader=False: scheduler duplicate na ho