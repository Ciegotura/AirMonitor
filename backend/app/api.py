from fastapi import APIRouter
from app.db.database import SessionLocal
from app.db.models import Measurement

router = APIRouter()

@router.get("/latest")
def get_latest():
    db = SessionLocal()
    m = db.query(Measurement).order_by(Measurement.timestamp.desc()).first()
    db.close()
    return m