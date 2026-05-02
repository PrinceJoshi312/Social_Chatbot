import httpx
import re
import json
import traceback
import logging
import asyncio
import google.generativeai as genai
from app.core.config import settings
from app.core.security import secret_manager
from app.db import models
from sqlalchemy.orm import Session

logger = logging.getLogger("LLMService")

class LLMService:
    _client = None

    def __init__(self):
        self.ollama_base_url = settings.OLLAMA_BASE_URL
        self.default_provider = settings.AI_PROVIDER
        self.default_gemini_model = settings.GEMINI_MODEL
        self.default_ollama_model = settings.OLLAMA_MODEL

    def _get_client(self):
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=300.0) # 5 min timeout
        return self._client

    async def generate_response(
        self, 
        system_prompt: str, 
        context: list[str], 
        query: str,
        db: Session = None,
        business_id: int = None,
        tool_registry = None
    ) -> tuple[str, any]:
        # 1. Resolve Provider and Settings
        provider = self.default_provider
        model = self.default_gemini_model if provider == "gemini" else self.default_ollama_model
        api_key = settings.GEMINI_API_KEY
        
        if db and business_id:
            biz = db.query(models.Business).filter(models.Business.id == business_id).first()
            if biz:
                provider = biz.ai_provider or provider
                if biz.llm_model_override:
                    model = biz.llm_model_override
                else:
                    model = self.default_gemini_model if provider == "gemini" else self.default_ollama_model
                
                # Try to get business-specific API key
                if biz.encrypted_gemini_api_key:
                    decrypted = secret_manager.decrypt(biz.encrypted_gemini_api_key)
                    if decrypted:
                        api_key = decrypted

        context_str = "\n---\n".join(context) if context else "NULL_CONTEXT"
        
        full_prompt = f"""
### SYSTEM INSTRUCTION
{system_prompt}
ROLE: You are a PRECISION DATA EXTRACTION ENGINE.
RULE 1: Use the KNOWLEDGE_BASE_CONTEXT to answer the user query.
RULE 2: If the answer is missing, say "DATA_NOT_FOUND".
RULE 3: No conversational filler.

### KNOWLEDGE_BASE_CONTEXT
{context_str}

### USER QUERY
{query}
"""
        
        # 2. Call selected provider
        if provider == "gemini":
            response_text = await self._call_gemini(full_prompt, model, api_key)
        else:
            response_text = await self._call_ollama(full_prompt, model)

        # 3. Handle Tool Calls (Simplified for refactor)
        tool_metadata = None
        if "TOOL_CALL:" in response_text and tool_registry:
            match = re.search(r"TOOL_CALL:\s*(\w+)\((.*?)\)", response_text, re.DOTALL)
            if match:
                tool_name = match.group(1)
                tool_args = match.group(2)
                try:
                    observation = tool_registry.execute(tool_name, tool_args)
                    tool_metadata = {"tool": tool_name, "args": tool_args, "result": observation}
                    
                    second_prompt = f"{full_prompt}\n{response_text}\nObservation: {observation}\nFinal Answer:"
                    if provider == "gemini":
                        response_text = await self._call_gemini(second_prompt, model, api_key)
                    else:
                        response_text = await self._call_ollama(second_prompt, model)
                except:
                    pass

        return response_text, tool_metadata

    async def _call_gemini(self, prompt: str, model: str, api_key: str) -> str:
        if not api_key:
            return "Error: Gemini API Key not configured."
        try:
            genai.configure(api_key=api_key)
            gemini_model = genai.GenerativeModel(model)
            response = await asyncio.to_thread(gemini_model.generate_content, prompt)
            return response.text.strip()
        except Exception as e:
            # Sanitize logs: ensure api_key is never in the error message string
            err_msg = str(e)
            if api_key in err_msg:
                err_msg = err_msg.replace(api_key, "[REDACTED_KEY]")
            logger.error(f"Gemini error: {err_msg}")
            return f"Error: Gemini engine encountered an issue. {err_msg[:100]}"

    async def _call_ollama(self, prompt: str, model: str) -> str:
        client = self._get_client()
        try:
            url = f"{self.ollama_base_url}/api/generate"
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": { "temperature": 0.1 }
            }
            
            response = await client.post(url, json=payload)
            if response.status_code != 200:
                return f"Ollama error: {response.status_code}"
            return response.json().get("response", "").strip()
        except Exception as e:
            logger.error(f"Ollama error: {e}")
            return f"Error: Local AI engine is not responding. Ensure Ollama is running."
