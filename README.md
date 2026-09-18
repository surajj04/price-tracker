# 🔍 Price Tracker

A Flask-based web application that tracks product prices on **Amazon** and **Flipkart**. Paste a product URL, choose how often you want it checked, and the app automatically scrapes the price in the background, stores the full price history, and notifies you when the price drops or increases.

## Features

- 🔗 **Add any Amazon or Flipkart product URL** — platform is auto-detected from the URL
- ⏱ **Custom check frequency** — every 15 minutes, hourly, or daily
- 🤖 **Automated background scraping** using [APScheduler](https://apscheduler.readthedocs.io/) — no manual refresh needed
- 📉 **Price comparison** — every check compares the new price against the last known price
- 🔔 **In-app notifications** — get notified on the dashboard when a tracked product's price drops or increases
- 📊 **Full price history** for every product, viewable on its detail page
- 🗂 **Rich product data** — rating, review count, category, highlights, and specifications are scraped and stored, not just the price
- 💾 **SQLite database** via SQLAlchemy — zero external DB setup required

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Flask |
| Database | SQLite + Flask-SQLAlchemy |
| Scheduling | APScheduler |
| Scraping | Playwright (Python) |
| Frontend | Jinja2 templates + vanilla CSS |

## Project Structure

```
price-tracker/
├── app.py                     # Flask routes (home, track, dashboard, notifications)
├── models.py                  # SQLAlchemy models: Product, PriceHistory, Notification
├── scheduler.py                # APScheduler jobs — runs scrapers on a per-product interval
├── pyproject.toml
├── price_trcakers/             # Raw scraping logic (Playwright)
│   ├── amazon.py               # Amazon scraper
│   └── flipkart.py             # Flipkart scraper
├── scrapers/                   # Adapter layer
│   ├── __init__.py             # Dispatches to the right scraper + normalizes output
│   └── utils.py                # Price string parsing helper
└── templates/
    ├── base.html                # Shared layout, nav, flash messages
    ├── index.html                # URL input + frequency form
    ├── dashboard.html            # List of all tracked products
    ├── product_detail.html       # Single product: price history, specs, rating
    └── notifications.html        # Price drop/increase notification feed
```

## How It Works

1. User submits a product URL and a check frequency on the home page.
2. The platform (Amazon/Flipkart) is detected from the URL and a `Product` row is created.
3. A recurring APScheduler job is registered for that product, running at the chosen interval.
4. On each run, the scraper fetches the current price and product details.
5. The new price is compared against the previous price:
   - If it dropped → a 🔻 notification is created
   - If it increased → a 🔺 notification is created
6. Every check is logged in `PriceHistory`, and the product's latest details are updated.

## Setup

### Prerequisites
- Python 3.12+
- [uv](https://github.com/astral-sh/uv) (or pip)

### Install dependencies
```bash
uv sync
```
or, with pip:
```bash
pip install -e .
```

### Install Playwright's browser binary
```bash
playwright install chromium
```

### Run the app
```bash
python app.py
```
Then open **http://127.0.0.1:5000** in your browser.

## Usage

1. Go to the home page and paste an Amazon or Flipkart product URL.
2. Choose a check frequency (15 min / hourly / daily).
3. Click **Start Tracking** — you'll be redirected to the dashboard.
4. Check the **Dashboard** for current prices across all tracked products.
5. Click a product to see its full price history, rating, and specifications.
6. Check **Notifications** (top right) for price drop/increase alerts.

## Notes

- The scrapers use Playwright in non-headless mode by default (`headless=False`) for easier debugging — switch to `headless=True` in `price_trcakers/amazon.py` / `flipkart.py` for production/server use.
- Scraper selectors are tied to Amazon's/Flipkart's current page structure and may need updates if either site changes its layout.

## License

Add your license here.