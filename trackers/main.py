from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from playwright.sync_api import sync_playwright
from scrapers.flipkart import scrape_flipkart_product
from scrapers.amazon import scrape_amazon_product
import logging
from scrapers import _convert_flipkart, _convert_amazon


app = FastAPI()

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("FlipkartScraper")

origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get('/status')
def status():
    return {"status":True, "Message": "Trackers are working"}


@app.post('/run-flipkart-tracker')
def run_flipkart_tracker(url:str):
    browser = None
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
            page = browser.new_page(no_viewport=True)

            try:
                raw = scrape_flipkart_product(page, url)
                return _convert_flipkart(raw)
            finally:
                if browser is not None and browser.is_connected():
                    browser.close()
    except Exception as e:
        logger.exception(f"An error occurred during scraping: {e}")
        return None

@app.post('/run-amazon-tracker')
def run_amazon_tracker(url:str):
    browser = None
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
            page = browser.new_page(no_viewport=True)

            try:
                # return scrape_amazon_product(page, url)
                raw = scrape_amazon_product(page, url)
                return _convert_amazon(raw)
                
            finally:
                if browser is not None and browser.is_connected():
                    browser.close()
    except Exception as e:
        logger.exception(f"An error occurred during scraping: {e}")
        return None