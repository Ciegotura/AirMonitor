from fastapi import APIRouter
from app.db.database import SessionLocal
from app.db.models import Measurement
from app.services.airly_client import fetch_air_quality

router = APIRouter()

@router.get("/latest")
def get_latest():
    db = SessionLocal()
    m = db.query(Measurement).order_by(Measurement.timestamp.desc()).first()
    db.close()
    return m

@router.get("/fetch-latest")
def fetch_latest(lat: float = 52.237, lng: float = 21.017):
    """Fetch latest air quality data from Airly API"""
    try:
        data = fetch_air_quality(lat, lng)
        
        # Extract PM values
        pm25 = None
        pm10 = None
        
        if "current" in data and "values" in data["current"]:
            for value in data["current"]["values"]:
                if value["name"] == "PM25":
                    pm25 = value["value"]
                elif value["name"] == "PM10":
                    pm10 = value["value"]
        
        # Save to database
        db = SessionLocal()
        measurement = Measurement(
            lat=lat,
            lng=lng,
            pm25=pm25,
            pm10=pm10
        )
        db.add(measurement)
        db.commit()
        db.refresh(measurement)
        db.close()
        
        return {
            "id": measurement.id,
            "lat": measurement.lat,
            "lng": measurement.lng,
            "pm25": measurement.pm25,
            "pm10": measurement.pm10,
            "timestamp": measurement.timestamp
        }
    except Exception as e:
        return {"error": str(e)}