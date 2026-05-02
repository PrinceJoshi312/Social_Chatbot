import os
import logging
from cryptography.fernet import Fernet
from app.core.config import settings

logger = logging.getLogger("Security")

class SecretManager:
    """
    Handles encryption and decryption of sensitive API keys at rest.
    """
    def __init__(self):
        self.enabled = False
        self.fernet = None
        
        secret = settings.API_KEY_ENCRYPTION_SECRET
        if secret:
            try:
                # Secret must be a base64-encoded 32-byte key for Fernet
                self.fernet = Fernet(secret.encode())
                self.enabled = True
            except Exception as e:
                logger.error(f"Failed to initialize encryption: {e}. Check API_KEY_ENCRYPTION_SECRET format.")
        else:
            logger.warning("API_KEY_ENCRYPTION_SECRET not set. User API keys will not be stored.")

    def encrypt(self, plain_text: str) -> str:
        if not self.enabled or not plain_text:
            return None
        return self.fernet.encrypt(plain_text.encode()).decode()

    def decrypt(self, encrypted_text: str) -> str:
        if not self.enabled or not encrypted_text:
            return None
        try:
            return self.fernet.decrypt(encrypted_text.encode()).decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            return None

    def mask_key(self, key: str) -> str:
        if not key:
            return ""
        if len(key) <= 8:
            return "****"
        return f"{key[:4]}****{key[-4:]}"

secret_manager = SecretManager()
