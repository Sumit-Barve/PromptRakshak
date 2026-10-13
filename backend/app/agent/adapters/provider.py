import json
import httpx
from typing import List, Dict, Any, Optional, Tuple
from ...config import config, redact_secrets

class ProviderAdapter:
    """Universal adapter supporting OpenAI, Gemini, Anthropic, Groq, Ollama, and OpenAI-compatible endpoints."""

    @classmethod
    async def call_model(
        cls,
        messages: List[Dict[str, Any]],
        tools: List[Dict[str, Any]],
        timeout: Optional[float] = None
    ) -> Tuple[Optional[str], List[Dict[str, Any]], Optional[str]]:
        """
        Executes a native tool-calling request to the configured LLM.
        Returns: (text_content, list_of_tool_calls, error_message)
        """
        provider = config.provider.lower().strip()
        timeout_val = timeout or config.timeout_seconds

        if provider == "anthropic":
            return await cls._call_anthropic(messages, tools, timeout_val)
        else:
            # Default to OpenAI-compatible interface (works for OpenAI, Gemini, Groq, Ollama, OpenRouter)
            return await cls._call_openai_compatible(messages, tools, timeout_val)

    @classmethod
    async def _call_openai_compatible(
        cls,
        messages: List[Dict[str, Any]],
        tools: List[Dict[str, Any]],
        timeout: float
    ) -> Tuple[Optional[str], List[Dict[str, Any]], Optional[str]]:
        provider = config.provider.lower().strip()
        api_key = config.api_key or ""
        model = config.model

        # Determine endpoint URL
        base_url = config.base_url
        if not base_url:
            if provider == "gemini":
                base_url = "https://generativelanguage.googleapis.com/v1beta/openai"
            elif provider == "groq":
                base_url = "https://api.groq.com/openai/v1"
            elif provider == "ollama":
                base_url = "http://localhost:11434/v1"
            elif provider == "openrouter":
                base_url = "https://openrouter.ai/api/v1"
            else:
                base_url = "https://api.openai.com/v1"

        endpoint = f"{base_url.rstrip('/')}/chat/completions"

        headers = {
            "Content-Type": "application/json",
        }
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": 0.1,
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(endpoint, headers=headers, json=payload)
                if response.status_code != 200:
                    err_text = redact_secrets(response.text)
                    return None, [], f"LLM API error ({response.status_code}): {err_text}"

                data = response.json()
                choice = data.get("choices", [{}])[0]
                message = choice.get("message", {})
                content = message.get("content")
                raw_tool_calls = message.get("tool_calls", [])

                parsed_tool_calls = []
                for tc in raw_tool_calls:
                    func = tc.get("function", {})
                    name = func.get("name", "")
                    raw_args = func.get("arguments", "{}")
                    try:
                        args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
                    except json.JSONDecodeError:
                        args = {}
                    parsed_tool_calls.append({
                        "id": tc.get("id", f"call_{len(parsed_tool_calls)}"),
                        "name": name,
                        "arguments": args
                    })

                return content, parsed_tool_calls, None

        except httpx.TimeoutException:
            return None, [], f"LLM request timed out after {timeout} seconds."
        except Exception as e:
            err_msg = redact_secrets(str(e))
            return None, [], f"LLM communication error: {err_msg}"

    @classmethod
    async def _call_anthropic(
        cls,
        messages: List[Dict[str, Any]],
        tools: List[Dict[str, Any]],
        timeout: float
    ) -> Tuple[Optional[str], List[Dict[str, Any]], Optional[str]]:
        api_key = config.api_key or ""
        model = config.model
        endpoint = "https://api.anthropic.com/v1/messages"

        # Transform messages for Anthropic
        system_content = ""
        filtered_messages = []
        for m in messages:
            if m.get("role") == "system":
                system_content += m.get("content", "") + "\n"
            else:
                filtered_messages.append(m)

        # Convert tool format to Anthropic tool schema
        anthropic_tools = []
        for t in tools:
            fn = t.get("function", {})
            anthropic_tools.append({
                "name": fn.get("name"),
                "description": fn.get("description"),
                "input_schema": fn.get("parameters", {"type": "object", "properties": {}})
            })

        headers = {
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01"
        }

        payload: Dict[str, Any] = {
            "model": model,
            "max_tokens": 1024,
            "messages": filtered_messages,
            "system": system_content.strip()
        }
        if anthropic_tools:
            payload["tools"] = anthropic_tools

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(endpoint, headers=headers, json=payload)
                if response.status_code != 200:
                    err_text = redact_secrets(response.text)
                    return None, [], f"Anthropic API error ({response.status_code}): {err_text}"

                data = response.json()
                content_blocks = data.get("content", [])
                text_content = ""
                parsed_tool_calls = []

                for block in content_blocks:
                    if block.get("type") == "text":
                        text_content += block.get("text", "")
                    elif block.get("type") == "tool_use":
                        parsed_tool_calls.append({
                            "id": block.get("id"),
                            "name": block.get("name"),
                            "arguments": block.get("input", {})
                        })

                return text_content or None, parsed_tool_calls, None

        except httpx.TimeoutException:
            return None, [], f"Anthropic request timed out after {timeout} seconds."
        except Exception as e:
            err_msg = redact_secrets(str(e))
            return None, [], f"Anthropic communication error: {err_msg}"
