import httpx
import json
import logging
import re
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


class OllamaClient:
    """HTTP client for Ollama API."""

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL
        self.timeout = httpx.Timeout(300.0)  # 5 min timeout for large responses

    async def generate(self, prompt: str, model: str = None, think: bool = False) -> str:
        """
        Send a prompt to Ollama and return the complete response text.
        Uses /api/generate endpoint with stream=False.
        Set think=True to enable Qwen3 thinking mode (slower, better for complex tasks).
        """
        model = model or self.model
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "think": think,  # Disable Qwen3 thinking mode by default for speed
            "options": {
                "temperature": 0.1,  # Low temperature for consistent structured output
                "top_p": 0.9,
                "num_predict": 4096,
            },
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/generate",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")

    async def generate_json(self, prompt: str, model: str = None) -> dict:
        """
        Generate and parse a JSON response from Ollama.
        Handles markdown code blocks and cleans the response.
        """
        raw_response = await self.generate(prompt, model)
        return self._extract_json(raw_response)

    def _extract_json(self, text: str) -> dict:
        """
        Extract JSON from response text.
        Handles cases where model wraps JSON in markdown code blocks.
        """
        # Remove <think>...</think> tags (Qwen3 thinking mode)
        text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()

        # Try to find JSON in markdown code block
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
        if json_match:
            text = json_match.group(1).strip()

        # Try to find raw JSON object
        json_obj_match = re.search(r'\{[\s\S]*\}', text)
        if json_obj_match:
            text = json_obj_match.group(0)

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from Ollama response: {e}\nRaw: {text[:500]}")
            return {"error": "Failed to parse AI response", "raw": text[:500]}

    async def health_check(self) -> bool:
        """Check if Ollama is running."""
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
        except Exception:
            return False


# Singleton instance
ollama_client = OllamaClient()
