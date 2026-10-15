import requests


def track_product(url: str):
    if "flipkart.com" in url:
        response = requests.post(
            "http://trackers:8081/run-flipkart-tracker",
            params={"url": url},
        )
        response.raise_for_status()
        data = response.json()
        return {"status": True, "data": data}
    elif "amazon.com" in url or "amazon.in" in url or "amzn.in" in url:
        response = requests.post(
            "http://trackers:8081/run-amazon-tracker",
            params={"url": url},
        )
        response.raise_for_status()

        data = response.json()
        return {"status": True, "data": data}
    else:
        return {"status": False, "data": None}
