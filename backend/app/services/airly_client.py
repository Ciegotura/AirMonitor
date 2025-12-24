import requests
import os

AIRLY_API_KEY = os.getenv("AIRLY_API_KEY")

BASE_URL = "https://airapi.airly.eu/v2/measurements/point"

def fetch_air_quality(lat: float, lng: float):
    headers = {
        "apikey": AIRLY_API_KEY,
        "Accept": "application/json"
    }
    params = {"lat": lat, "lng": lng}

    response = requests.get(BASE_URL, headers=headers, params=params)
    response.raise_for_status()
    return response.json()