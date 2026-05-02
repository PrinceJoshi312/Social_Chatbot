from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.models import Base, User, Business, Order, Plan, Subscription
from datetime import datetime

def seed():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Create default Plans
        plans = [
            {"name": "Starter", "price": 29.0, "max_docs": 5, "max_msgs": 500},
            {"name": "Pro", "price": 79.0, "max_docs": 50, "max_msgs": 5000},
            {"name": "Enterprise", "price": 499.0, "max_docs": 1000, "max_msgs": 1000000}
        ]
        
        db_plans = []
        for p in plans:
            existing = db.query(Plan).filter(Plan.name == p["name"]).first()
            if not existing:
                db_plan = Plan(
                    name=p["name"],
                    price=p["price"],
                    max_documents=p["max_docs"],
                    max_messages=p["max_msgs"]
                )
                db.add(db_plan)
                db_plans.append(db_plan)
        db.commit()
        print("Seeded subscription plans.")

        # 2. Create a Super Admin User
        admin = db.query(User).filter(User.email == "princejoshij736@gmail.com").first()
        if not admin:
            admin = User(
                email="princejoshij736@gmail.com",
                hashed_password="hashed_048Nc3", # Placeholder for local DB
                role="super_admin"
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print("Created Super Admin user (princejoshij736@gmail.com).")

        # 3. Create Acme Corp Business
        acme = db.query(Business).filter(Business.name == "Acme Corp").first()
        if not acme:
            acme = Business(
                name="Acme Corp",
                owner_id=admin.id,
                config={
                    "system_prompt": "You are the Official Assistant for Acme Corp.",
                    "whatsapp_verify_token": "whatsapp_bot_verify_token"
                }
            )
            db.add(acme)
            db.commit()
            db.refresh(acme)
            
            # Subscribe to Pro plan
            pro_plan = db.query(Plan).filter(Plan.name == "Pro").first()
            sub = Subscription(business_id=acme.id, plan_id=pro_plan.id, status="active")
            db.add(sub)
            db.commit()
            print("Created Acme Corp business and subscribed to Pro plan.")

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
