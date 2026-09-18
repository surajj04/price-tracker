from playwright.sync_api import Locator
import logging
from typing import Dict, Any, Optional
import re
from playwright.sync_api import sync_playwright
import logging
from typing import Dict, Any


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("AmazonScraper")


def clean_text(text: Optional[str]) -> str:
    if not text:
        return ""
    text = re.sub(r"[\u200e\u200f\u200b\u00a0]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def safe_extract(locator: Locator, attribute: Optional[str] = None) -> str:
    try:
        if locator.count() == 0:
            return "Not found"
            
        if attribute:
            val = locator.first.get_attribute(attribute)
            extracted = clean_text(val) if val else "Not found"
        else:
            extracted = clean_text(locator.first.text_content())
            
        if extracted != "Not found":
            extracted = remove_repeated_text(extracted)
            
        return extracted if extracted else "Not found"
    except Exception as e:
        logger.debug(f"Extraction error: {e}")
        return "Not found"

def remove_repeated_text(text: str) -> str:
    if not text:
        return text
    
    text = text.strip()
    
    # 1. Check for exact full-string duplication (e.g., "₹1,16,990.00₹1,16,990.00")
    length = len(text)
    if length > 0 and length % 2 == 0:
        half = length // 2
        if text[:half] == text[half:]:
            text = text[:half]
            
    # 2. Remove consecutive duplicate words/tokens (e.g., "3.7 3.7 out of 5 stars")
    words = text.split()
    if words:
        deduped_words = [words[0]]
        for word in words[1:]:
            if word != deduped_words[-1]:
                deduped_words.append(word)
        text = " ".join(deduped_words)
        
    return text

def extract_table_data(table_locator: Locator) -> Dict[str, str]:
    data = {}
    try:
        rows = table_locator.locator('tr')
        for i in range(rows.count()):
            row = rows.nth(i)
            th = row.locator('th')
            td = row.locator('td')
            
            if th.count() > 0 and td.count() > 0:
                key = clean_text(th.first.text_content())
                val = clean_text(td.first.text_content())
                if key and val:
                    data[key.replace(":", "")] = val
            elif td.count() >= 2:
                key = clean_text(td.first.text_content())
                val = clean_text(td.last.text_content())
                if key and val:
                    data[key.replace(":", "")] = val
    except Exception as e:
        logger.error(f"Error parsing specification table: {e}")
    return data


def scrape_amazon_product(page, url: str) -> Dict[str, Any]:
        try:
            logger.info(f"Navigating to target URL: {url}")
            page.goto(url, wait_until="domcontentloaded")

            product_title = safe_extract(page.locator("#productTitle"))
            
            discount_price = safe_extract(page.locator(".apex-core-price-identifier span").first)
            product_price = safe_extract(page.locator(".apex-core-price-identifier span").last)
            
            if discount_price == "Not found":
                discount_price = safe_extract(page.locator(".priceToPay span.a-price-whole").first)
            if product_price == "Not found":
                product_price = safe_extract(page.locator("span.basisPrice span.a-offscreen").first)

            rating_block = page.locator("#averageCustomerratings")
            if rating_block.count() > 0:
                rating = safe_extract(rating_block.locator('span span a span').first)
                review = safe_extract(rating_block.locator('span').last)
            else:
                rating, review = "Not found", "Not found"

            # Data Containers

            product_details = {}
            additional_details = {}

            # Layout Variant Branches
            product_overview = page.locator('[data-csa-c-slot-id="product-overview-classic"]')
            if product_overview.count() > 0:
                logger.info("Detected standard layout structure. Extracting overview...")
                product_details = extract_table_data(product_overview)
            
            spec_button = page.locator("a.a-button-text", has_text="See all product specifications")
            if spec_button.count() > 0:
                logger.info("Triggering full specifications view panel...")
                spec_button.first.click(force=True)
                page.wait_for_timeout(1500)

            tech_tables = page.locator('.prodDetTable')
            if tech_tables.count() > 0:
                for i in range(tech_tables.count()):
                    additional_details.update(extract_table_data(tech_tables.nth(i)))

            # Fallback Bullet Detail Extraction
            detail_bullets = page.locator('#detailBullets_feature_div')   # 👈 naya naam
            if detail_bullets.count() > 0:
                list_items = detail_bullets.last.locator('li')
                for i in range(list_items.count()):
                    item = list_items.nth(i)
                    spans = item.locator("span")
                    if spans.count() >= 2:
                        key = clean_text(spans.first.text_content()).replace(":", "")
                        value = clean_text(spans.last.text_content())
                        if key and value:
                            product_details[key] = value   # ✅ ab ye dict hi hai, kaam karega

            category = (
                product_details.get("Generic Name") or 
                product_details.get("Item model number") or 
                additional_details.get("Manufacturer") or 
                "Not Found"
            )

            return {
                "product_title": product_title,
                "product_price": product_price,
                "discount_price": discount_price,
                "product_rating": rating,
                "product_reviews": review,
                "product_category": category,
                "product_details": product_details,
                "additional_details": additional_details,
                "platform": "Amazon"
            }

        except Exception as e:
            logger.error(f"Critical scraping failure: {e}")
            raise




def run_amazon_scraper(url):
    browser = None
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False, args=["--start-maximized"])
            page = browser.new_page(no_viewport=True)

            try:
                return scrape_amazon_product(page, url)   
                
            finally:
                if browser is not None and browser.is_connected():
                    browser.close()
    except Exception as e:
        logger.exception(f"An error occurred during scraping: {e}")
        return None