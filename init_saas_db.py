import os
from sqlalchemy import create_engine
from app.db.models import Base, User, Business
from app.core.config import settings

def init_db():
    print("--- SaaS Database Initialization ---")
    
    # Path to the database file
    db_path = "sql_app.db"
    
    # Force delete if exists
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
            print(f"Successfully removed existing database at {db_path}")
        except Exception as e:
            print(f"Error removing database: {e}")
            return

    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    
    # Create all tables fresh
    print("Creating new tables with SaaS schema...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

if __name__ == "__main__":
    init_db()
