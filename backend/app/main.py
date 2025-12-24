from fastapi import FastAPI
from app.api import router
from app.scheduler import start_scheduler

app = FastAPI(title="AirMonitor")

app.include_router(router)

@app.on_event("startup")
def startup_event():
    start_scheduler()