import httpx
import re
import json
import traceback
from app.core.config import settings

class LLMService:
    _client = None

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.LLM_MODEL # Uses llama3.2:1b from .env

    def _get_client(self):
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=180.0) # 3 min timeout
        return self._client

    async def generate_response(
        self, 
        system_prompt: str, 
        context: list[str], 
        query: str,
        tool_registry = None
    ) -> tuple[str, any]:
        context_str = "\n---\n".join(context) if context else "No relevant documents found."
        
        # High-quality prompt for Llama 3.2
        full_prompt = f"""
System: {system_prompt}

Context from Knowledge Base:
{context_str}

Instructions:
- Use the context above to answer. 
- If the user asks for order status, output: TOOL_CALL: get_order_status({{"order_number": "ID"}})

User: {query}
Assistant:"""
        
        response_text = await self._call_ollama(full_prompt)

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
                    response_text = await self._call_ollama(second_prompt)
                except:
                    pass

        return response_text, tool_metadata

    async def _call_ollama(self, prompt: str) -> str:
        client = self._get_client()
        try:
            url = f"{self.base_url}/api/generate"
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": { 
                    "temperature": 0.2,
                    "num_predict": 250 
                }
            }
            
            response = await client.post(url, json=payload)
            if response.status_code != 200:
                return f"Ollama error: {response.status_code}"
            return response.json().get("response", "").strip()
        except Exception as e:
            return f"Error: Local AI engine is not responding. Ensure Ollama is running."
