from playwright.sync_api import sync_playwright
import logging
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from urllib.parse import urlparse

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("FlipkartScraper")


def safe_text(locator, default="Not Found", timeout=1000):
    try:
        if locator.count() == 0:
            return default

        value = locator.first.text_content(timeout=timeout)

        return value.strip() if value else default

    except PlaywrightTimeoutError:
        return default


def safe_attribute(locator, attribute, default="Not Found", timeout=1000):
    try:
        if locator.count() == 0:
            return default

        value = locator.first.get_attribute(attribute, timeout=timeout)

        return value.strip() if value else default

    except PlaywrightTimeoutError:
        return default


def extract_id_from_link(link):
    if not link or link == "Not Found":
        return "Not Found"

    try:
        path_parts = urlparse(link).path.strip("/").split("/")

        if "p" in path_parts:
            index = path_parts.index("p")

            if index + 1 < len(path_parts):
                return path_parts[index + 1]

    except Exception:
        pass

    return "Not Found"


def extract_sepcs(page, path):
    product_spec = {}
    elements = page.locator(f"xpath= {path}")
    for i in range(elements.count()):
        spec = elements.nth(i)
        key = safe_text(spec.locator("xpath= ./div//div[1]"))
        value = safe_text(spec.locator("xpath= ./div//div[2]"))
        product_spec.update({key:value})

    category = safe_text(page.locator("xpath= //div[normalize-space()='Generic Name']/following-sibling::div[1]"))
    product_spec.update({'category': category})
    
    return product_spec

def extract_highlights(page,path, elec=False):
    product_details = []
    highlights = page.locator(f"{path}")
    
    n = 0
    for i in range(highlights.count()):
        item = highlights.nth(i)
        if elec:
            if n != 1 and n!= 0:
                product_details.append(safe_text(item))
            n+=1
        else:
            product_details.append(safe_text(item))
    return product_details

def scrape_flipkart_product(page, target_url: str) -> dict:
    try:
        page.goto(target_url)
        page.wait_for_load_state("networkidle")

        link = page.url
        product_id = extract_id_from_link(link)

        # Default values
        title = "Not Found"
        discount_price = "Not Found"
        rating = "Not Found"
        reviews = "Not Found"
        product_details = []
        product_link = link
        product_price = "Not Found"

        title = safe_text(page.locator("xpath= //div/h1"))

        price = page.locator("xpath= //div[2]/div/div/div/div/div/div/div/div/div/div/div/div/div/a[1]/div/div[3]/div")
        if price.count() > 0:
            product_price = safe_text(price)

            discount_price = safe_text(page.locator("xpath= //div[2]/div/div/div/div/div/div/div/div/div/div/div/div/div/a[1]/div/div[2]/div"))

            rating = safe_text(page.locator("xpath= //div[2]/div/div/div/div/div/div/div/div/a/div/div/div/div/div[1]"))

            reviews = safe_text(page.locator("xpath= //div[2]/div/div/div/div/div/div/div/div/a/div/div/div/div/div[2]")).replace('| ','')

            product_details = extract_highlights(page,"xpath= //div/div[2]/div/div/div/div[1]/div/div[2]/div/div/div/div/div/div/div/div/div[1]/div/div[2]/div/div/div/div/div", True)

            product_specs = {}
            page.locator("xpath= //div[normalize-space()='Specifications']").first.click()
            specs = page.locator("xpath= //div/div[2]/div/div/div[2]/div[2]/div/div/div/div/div/div[1]/div[1]/div/div/div")
            if specs.count() > 0:
                product_specs.update(extract_sepcs(page,"//div/div[2]/div/div/div[2]/div[2]/div/div/div/div/div/div[1]/div[1]/div/div/div/div/div[2]/div"))
            else:
                product_specs.update(extract_sepcs(page, "//div/div[2]/div/div/div[2]/div/div/div/div/div/div[1]/div[1]/div/div/div/div/div[2]/div"))


        else:
            product_price = safe_text(page.locator("xpath= //div[1]/div/div[2]/div/div/div/div/div/div/div/div/div/a/div/div[3]/div"))
            
            discount_price = safe_text(page.locator("xpath= //div[1]/div/div[2]/div/div/div/div/div/div/div/div/div/a/div/div[2]/div"))

            rating = safe_text(page.locator("xpath= //div/div[1]/div/div[2]/div/div/div/div/div/div/div/div/a/div/div/div/div/div[1]"))

            reviews = safe_text(page.locator("xpath= //div/div[1]/div/div[2]/div/div/div/div/div/div/div/div/a/div/div/div/div/div[2]")).replace('| ','')

            product_details = extract_highlights(page,"._1psv1zeb9._1psv1ze0._1psv1ze4i._1o6mltlk4._1psv1ze6r._1psv1ze29._1psv1zej9")

            product_specs = {}
            page.locator("xpath= //div[normalize-space(.)='All details']").first.click()
            page.locator("xpath= //div[normalize-space()='Specifications']").first.click()
            specs = page.locator("xpath= //div/div[2]/div/div/div[2]/div[2]/div/div/div/div/div/div[1]/div[1]/div/div/div")

            if specs.count() > 0:
                product_specs.update(extract_sepcs(page,"//div/div[2]/div/div/div[2]/div[2]/div/div/div/div/div/div[1]/div[1]/div/div/div/div/div[2]/div"))
            else:
                product_specs.update(extract_sepcs(page, "//div/div[2]/div/div/div[2]/div/div/div/div/div/div[1]/div[1]/div/div/div/div/div[2]/div"))


        return {
            "product_id": product_id,
            "product_title": title,
            "product_price": product_price,
            "discount_price": discount_price,
            "product_rating": rating,
            "product_reviews": reviews,
            "product_category": product_specs['category'],
            "product_details": product_details,
            "additional_details": product_specs,
            "product_link": product_link,
            "platform": "Flipkart",
        }

    except Exception as e:
        logger.exception(f"An error occurred during scraping: {e}")
        return {}



def run_flipkart_scraper(url):
    browser = None
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False, args=["--start-maximized"])
            page = browser.new_page(no_viewport=True)

            try:
                return scrape_flipkart_product(page, url)   
                
            finally:
                if browser is not None and browser.is_connected():
                    browser.close()
    except Exception as e:
        logger.exception(f"An error occurred during scraping: {e}")
        return None