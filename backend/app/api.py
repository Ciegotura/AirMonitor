from fastapi import APIRouter, Query
from app.db.database import SessionLocal
from app.db.models import Measurement
from app.services.airly_client import fetch_air_quality, fetch_nearest_installations

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

@router.get("/fetch-nearby")
def fetch_nearby(lat: float = 52.237, lng: float = 21.017, distance: int = 5, max_results: int = 30):
    """Fetch nearby installations and save to database"""
    try:
        installations = fetch_nearest_installations(lat, lng, distance, max_results)
        db = SessionLocal()
        
        result = []
        for inst in installations:
            inst_lat = inst.get("location", {}).get("latitude")
            inst_lng = inst.get("location", {}).get("longitude")
            
            if not inst_lat or not inst_lng:
                continue
            
            try:
                # Fetch measurements for this installation
                measurements = fetch_air_quality(inst_lat, inst_lng)
                pm25 = None
                pm10 = None
                
                if "current" in measurements and "values" in measurements["current"]:
                    for value in measurements["current"]["values"]:
                        if value["name"] == "PM25":
                            pm25 = value["value"]
                        elif value["name"] == "PM10":
                            pm10 = value["value"]
                
                # Save to database
                measurement = Measurement(
                    lat=inst_lat,
                    lng=inst_lng,
                    pm25=pm25,
                    pm10=pm10
                )
                db.add(measurement)
                
                result.append({
                    "lat": inst_lat,
                    "lng": inst_lng,
                    "pm25": pm25,
                    "pm10": pm10,
                    "address": inst.get("address", {}).get("displayAddress", "")
                })
            except Exception as e:
                print(f"Error fetching for installation: {e}")
                continue
        
        db.commit()
        db.close()
        
        return result
    except Exception as e:
        db.close()
        return {"error": str(e)}

@router.get("/measurements")
def get_measurements(limit: int = Query(100, description="Max number of rows to return")):
    """Return measurements from database (most recent first)."""
    db = SessionLocal()
    try:
        rows = db.query(Measurement).order_by(Measurement.id.desc()).limit(limit).all()
        result = []
        for r in rows:
            result.append({
                "id": r.id,
                "lat": r.lat,
                "lng": r.lng,
                "pm25": r.pm25,
                "pm10": r.pm10,
                "timestamp": r.timestamp.isoformat() if getattr(r, "timestamp", None) else None
            })
        return result
    finally:
        db.close()