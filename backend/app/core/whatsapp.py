import httpx
from app.core.config import settings

class WhatsAppService:
    def __init__(self):
        self.token = settings.WHATSAPP_TOKEN
        self.phone_id = settings.WHATSAPP_PHONE_ID
        self.base_url = f"https://graph.facebook.com/v19.0/{self.phone_id}/messages"

    async def send_message(self, to: str, text: str):
        if not self.token or not self.phone_id:
            print("WhatsApp credentials missing. Skipping message send.")
            return None

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": text}
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(self.base_url, headers=headers, json=payload)
            return response.json()
