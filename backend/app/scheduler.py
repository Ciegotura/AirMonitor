from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()

def start_scheduler():
    """Start background scheduler"""
    if not scheduler.running:
        scheduler.start()
        print("Scheduler started")

def stop_scheduler():
    """Stop background scheduler"""
    if scheduler.running:
        scheduler.shutdown()
        print("Scheduler stopped")
