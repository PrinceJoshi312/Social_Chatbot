import httpx
import re
from app.core.config import settings

class LLMService:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.LLM_MODEL

    async def generate_response(
        self, 
        system_prompt: str, 
        context: list[str], 
        query: str,
        tool_registry = None
    ) -> str:
        # Construct context string
        context_str = "\n---\n".join(context) if context else "No relevant documents found."
        
        # Construct Tool information
        tools_info = ""
        if tool_registry:
            tools_info = f"\n\nAVAILABLE TOOLS:\n{tool_registry.get_tool_descriptions()}\n"
            tools_info += "\nIf you need to use a tool to answer, output ONLY: TOOL_CALL: tool_name({\"arg\": \"val\"})\n"

        full_prompt = f"""
System: {system_prompt or "You are a helpful assistant."}{tools_info}
Use the retrieved context to answer. If tools are available and needed, use them first.

Context:
{context_str}

User Question: {query}
Answer:"""

        response_text = await self._call_ollama(full_prompt)

        # Check for tool call
        tool_metadata = None
        if "TOOL_CALL:" in response_text and tool_registry:
            match = re.search(r"TOOL_CALL:\s*(\w+)\((.*?)\)", response_text, re.DOTALL)
            if match:
                tool_name = match.group(1)
                tool_args = match.group(2)
                
                # Execute tool
                observation = tool_registry.execute(tool_name, tool_args)
                tool_metadata = {"tool": tool_name, "args": tool_args, "result": observation}
                
                # Second pass with observation
                second_prompt = f"""
{full_prompt}
{response_text}
Observation: {observation}
Final Answer:"""
                final_response = await self._call_ollama(second_prompt)
                return final_response, tool_metadata

        return response_text, tool_metadata

    async def _call_ollama(self, prompt: str) -> str:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False
                    }
                )
                
                if response.status_code != 200:
                    return f"Error from Ollama: {response.text}"
                
                return response.json().get("response", "No response generated.").strip()
        except Exception as e:
            return f"Failed to connect to Ollama: {str(e)}"
