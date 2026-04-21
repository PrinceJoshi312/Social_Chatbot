from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Base, Business, Order
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_orders():
    db = SessionLocal()
    
    # 1. Get or create business
    business = db.query(Business).filter(Business.name == "Acme Corp").first()
    if not business:
        business = Business(name="Acme Corp", config={"system_prompt": "Helpful agent."})
        db.add(business)
        db.commit()
        db.refresh(business)

    # 2. Add some test orders
    orders = [
        Order(order_number="AC123", customer_name="John Doe", status="shipped", total=4500, business_id=business.id),
        Order(order_number="AC456", customer_name="Jane Smith", status="delivered", total=12000, business_id=business.id),
        Order(order_number="AC789", customer_name="Bob Brown", status="pending", total=3250, business_id=business.id),
    ]

    for order in orders:
        existing = db.query(Order).filter(Order.order_number == order.order_number).first()
        if not existing:
            db.add(order)
    
    db.commit()
    print(f"Seeded {len(orders)} orders for Acme Corp.")
    db.close()

if __name__ == "__main__":
    # Ensure tables exist (they should be created by main.py, but for safety)
    Base.metadata.create_all(bind=engine)
    seed_orders()
