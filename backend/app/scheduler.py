from apscheduler.schedulers.background import BackgroundScheduler
from app.services.airly_client import fetch_air_quality
from app.db.database import SessionLocal
from app.db.models import Measurement

#Schedukler lokalny, zastępuje Azure Function

def fetch_and_store():
    db = SessionLocal()
    data = fetch_air_quality(50.0647, 19.9450)  # Kraków
    values = data["current"]["values"]

    m = Measurement(
        lat=50.0647,
        lng=19.9450,
        pm25=next(v["value"] for v in values if v["name"] == "PM25"),
        pm10=next(v["value"] for v in values if v["name"] == "PM10"),
    )
    db.add(m)
    db.commit()
    db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(fetch_and_store, "interval", minutes=15)
    scheduler.start()