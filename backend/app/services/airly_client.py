import requests
import os

AIRLY_API_KEY = os.getenv("AIRLY_API_KEY")

BASE_URL = "https://airapi.airly.eu/v2/measurements/point"
INSTALLATIONS_URL = "https://airapi.airly.eu/v2/installations/nearest"

def fetch_air_quality(lat: float, lng: float):
    headers = {
        "apikey": AIRLY_API_KEY,
        "Accept": "application/json"
    }
    params = {"lat": lat, "lng": lng}

    response = requests.get(BASE_URL, headers=headers, params=params)
    response.raise_for_status()
    return response.json()

def fetch_nearest_installations(lat: float, lng: float, max_distance_km: int = 5, max_results: int = 30):
    """Fetch nearest air quality installations"""
    headers = {
        "apikey": AIRLY_API_KEY,
        "Accept": "application/json"
    }
    params = {
        "lat": lat,
        "lng": lng,
        "maxDistanceKM": max_distance_km,
        "maxResults": max_results
    }

    response = requests.get(INSTALLATIONS_URL, headers=headers, params=params)
    response.raise_for_status()
    return response.json()
