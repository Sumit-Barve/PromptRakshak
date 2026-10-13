import os
import re
from pathlib import Path
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from pydantic import BaseModel

# Load environment from root or backend directory
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

class AppConfig(BaseModel):
    provider: str = os.getenv("LLM_PROVIDER", "demo").lower().strip()
    api_key: Optional[str] = os.getenv("LLM_API_KEY", "").strip() or None
    model: str = os.getenv("LLM_MODEL", "gpt-4o-mini").strip()
    base_url: Optional[str] = os.getenv("LLM_BASE_URL", "").strip() or None
    timeout_seconds: float = float(os.getenv("LLM_TIMEOUT_SECONDS", "30.0"))
    max_iterations: int = int(os.getenv("AGENT_MAX_ITERATIONS", "5"))
    host: str = os.getenv("BACKEND_HOST", "127.0.0.1")
    port: int = int(os.getenv("BACKEND_PORT", "8000"))
    db_path: str = os.getenv("DATABASE_PATH", str(Path(__file__).resolve().parent.parent / "aegis.db"))

    def is_api_configured(self) -> bool:
        if self.provider == "demo":
            return False
        # If provider is Ollama, key is optional
        if self.provider == "ollama":
            return True
        return bool(self.api_key and len(self.api_key) > 4)

    def get_masked_api_key(self) -> Optional[str]:
        """Safely returns a masked representation of the key without exposing it."""
        if not self.api_key:
            return None
        if len(self.api_key) <= 8:
            return "********"
        prefix = self.api_key[:3]
        suffix = self.api_key[-4:]
        return f"{prefix}...{suffix}"

    def get_safe_status(self) -> Dict[str, Any]:
        """Status dict safe for UI consumption. Never exposes raw credentials."""
        return {
            "provider": self.provider,
            "model": self.model,
            "is_configured": self.is_api_configured(),
            "has_base_url": bool(self.base_url),
            "masked_key": self.get_masked_api_key(),
            "timeout_seconds": self.timeout_seconds,
            "max_iterations": self.max_iterations,
            "mode": "real" if self.is_api_configured() else "demo",
        }

config = AppConfig()

def redact_secrets(text: str) -> str:
    """Utility to scrub potential API keys or tokens from text before logging or storing."""
    if not text:
        return text
    # Redact actual configured API key if present
    if config.api_key and len(config.api_key) > 5:
        text = text.replace(config.api_key, "[REDACTED_API_KEY]")
    # Common secret patterns (Bearer tokens, OpenAI keys sk-..., Anthropic sk-ant-...)
    text = re.sub(r'sk-[a-zA-Z0-9_-]{20,}', '[REDACTED_KEY]', text)
    text = re.sub(r'Bearer\s+[a-zA-Z0-9_\-\.]{20,}', 'Bearer [REDACTED_TOKEN]', text)
    return text
