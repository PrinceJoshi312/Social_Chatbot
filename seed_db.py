import requests

BASE_URL = "http://localhost:8000/api"

def seed():
    # Create a test business
    business_data = {
        "name": "Acme Corp",
        "config": {
            "system_prompt": "You are the Official AI Assistant for Acme Corp. Your goal is to provide accurate, concise, and helpful information to customers via WhatsApp.\n\n### GUIDELINES:\n1. STRICT CONTEXT ADHERENCE: Use ONLY the provided context to answer. If the context is empty, contradictory, or missing the answer, politely state: \"I'm sorry, I don't have that specific information right now. Can I help with something else?\"\n2. WHATSAPP OPTIMIZED: Keep responses short (under 3-4 sentences). Use emojis occasionally. ALWAYS match the user's language.\n3. NO FABRICATION: Do not mention internal document names. Speak as if you naturally know this information.\n4. AGENT HANDOFF: If the user asks for a human OR expresses high frustration, say: \"I'll notify our team to get back to you as soon as possible.\"\n\n### TONE: Professional, helpful, and concise."
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/businesses/", json=business_data)
        if response.status_code == 200:
            print(f"Successfully created business: {response.json()['name']} (ID: {response.json()['id']})")
        else:
            print(f"Failed to create business: {response.text}")
    except Exception as e:
        print(f"Error: {e}. Is the backend running?")

if __name__ == "__main__":
    seed()
