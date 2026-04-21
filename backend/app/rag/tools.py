from sqlalchemy.orm import Session
from app.db.models import Order, Booking
from datetime import datetime
import json
from typing import Dict, Any

class ToolRegistry:
    def __init__(self, db: Session, business_id: int):
        self.db = db
        self.business_id = business_id
        self.tools = {
            "get_order_status": {
                "func": self.get_order_status,
                "description": "Retrieves the status of an order. Input: {\"order_number\": \"string\"}"
            },
            "create_booking": {
                "func": self.create_booking,
                "description": "Schedules a new appointment. Input: {\"name\": \"string\", \"time\": \"YYYY-MM-DD HH:MM\", \"service\": \"string\"}"
            },
            "get_bookings": {
                "func": self.get_bookings,
                "description": "Lists upcoming appointments for a customer. Input: {\"name\": \"string\"}"
            }
        }

    def get_tool_descriptions(self) -> str:
        descriptions = []
        for name, info in self.tools.items():
            descriptions.append(f"- {name}: {info['description']}")
        return "\n".join(descriptions)

    def execute(self, tool_name: str, args_json: str) -> str:
        if tool_name not in self.tools:
            return f"Error: Tool '{tool_name}' not found."
        
        try:
            # Parse JSON arguments
            args = json.loads(args_json)
            return self.tools[tool_name]["func"](**args)
        except json.JSONDecodeError:
            return f"Error: Invalid JSON format for tool arguments: {args_json}"
        except TypeError as e:
            return f"Error: Incorrect arguments for tool '{tool_name}': {str(e)}"
        except Exception as e:
            return f"Error executing tool '{tool_name}': {str(e)}"

    def get_order_status(self, order_number: str) -> str:
        order = self.db.query(Order).filter(
            Order.order_number == order_number,
            Order.business_id == self.business_id
        ).first()

        if not order:
            return f"Order '{order_number}' not found."

        return f"Order #{order.order_number} for {order.customer_name} is currently {order.status}. Total: ${order.total/100:.2f}."

    def create_booking(self, name: str, time: str, service: str) -> str:
        try:
            booking_dt = datetime.strptime(time, "%Y-%m-%d %H:%M")
            new_booking = Booking(
                customer_name=name,
                booking_time=booking_dt,
                service=service,
                business_id=self.business_id
            )
            self.db.add(new_booking)
            self.db.commit()
            return f"Successfully booked {service} for {name} on {time}."
        except ValueError:
            return "Error: Invalid time format. Please use YYYY-MM-DD HH:MM."

    def get_bookings(self, name: str) -> str:
        bookings = self.db.query(Booking).filter(
            Booking.customer_name == name,
            Booking.business_id == self.business_id
        ).all()

        if not bookings:
            return f"No bookings found for {name}."

        results = [f"- {b.service} on {b.booking_time.strftime('%Y-%m-%d %H:%M')} ({b.status})" for b in bookings]
        return f"Bookings for {name}:\n" + "\n".join(results)
