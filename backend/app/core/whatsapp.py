import httpx
from app.core.config import settings

class WhatsAppService:
    def __init__(self):
        self.base_url = "https://graph.facebook.com/v18.0"

    async def send_message(self, to: str, text: str, token: str = None, phone_id: str = None):
        # Use provided credentials or fallback to .env defaults
        access_token = token or settings.WHATSAPP_TOKEN
        phone_number_id = phone_id or settings.WHATSAPP_PHONE_ID

        if not access_token or not phone_number_id:
            print("Error: Missing WhatsApp credentials. Cannot send message.")
            return

        url = f"{self.base_url}/{phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": text}
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    print(f"WhatsApp API Error: {response.text}")
                return response.json()
        except Exception as e:
            print(f"Failed to send WhatsApp message: {e}")
            return None
