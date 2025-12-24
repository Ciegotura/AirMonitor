from app.db.database import engine
from app.db.models import Base

def init_db():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()
    print("Database initialized")
