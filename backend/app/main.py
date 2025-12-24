from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.api import router
from app.scheduler import start_scheduler

app = FastAPI(title="AirMonitor")

app.include_router(router)

# Serve static files (frontend)
frontend_path = Path(__file__).parent.parent.parent / "frontend"
if frontend_path.exists():
    app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="static")

@app.on_event("startup")
def startup_event():
    start_scheduler()