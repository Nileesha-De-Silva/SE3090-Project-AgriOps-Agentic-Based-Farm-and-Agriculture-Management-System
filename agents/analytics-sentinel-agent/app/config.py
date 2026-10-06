import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class Settings:
    backend_api_url: str = "http://localhost:5286/api"
    backend_agent_token: str = ""
    gemini_api_key: str = ""
    chat_model: str = "gemini-2.5-flash"
    checkpoint_db: str = str(ROOT / "data/sentinel_checkpoints.sqlite")
    model_timeout_seconds: int = 30
    backend_timeout_seconds: int = 15
    max_model_attempts: int = 2

    def __post_init__(self):
        url = urlparse(self.backend_api_url)
        if url.scheme not in {"http", "https"} or not url.hostname:
            raise ValueError("BACKEND_API_URL must be a valid HTTP(S) URL.")
        if url.scheme == "http" and url.hostname not in {"localhost", "127.0.0.1", "::1", "backend", "host.docker.internal"}:
            raise ValueError("Use HTTPS for a non-local backend.")
        if not 1 <= self.max_model_attempts <= 3:
            raise ValueError("MAX_MODEL_ATTEMPTS must be between 1 and 3.")
        if not 1 <= self.model_timeout_seconds <= 60 or not 1 <= self.backend_timeout_seconds <= 30:
            raise ValueError("Timeouts must be bounded (model <=60s, backend <=30s).")

    @property
    def has_llm_key(self) -> bool:
        return bool(self.gemini_api_key.strip())


def load_settings() -> Settings:
    load_dotenv(ROOT / ".env")
    load_dotenv(ROOT.parent.parent / ".env")
    checkpoint = Path(os.getenv("CHECKPOINT_DB", "data/sentinel_checkpoints.sqlite"))
    return Settings(
        backend_api_url=os.getenv("BACKEND_API_URL", "http://localhost:5286/api").rstrip("/"),
        backend_agent_token=os.getenv("BACKEND_AGENT_TOKEN", "").strip(),
        gemini_api_key=os.getenv("GEMINI_API_KEY", "").strip(),
        chat_model=os.getenv("CHAT_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash",
        checkpoint_db=str(checkpoint if checkpoint.is_absolute() else ROOT / checkpoint),
        model_timeout_seconds=int(os.getenv("MODEL_TIMEOUT_SECONDS", "30")),
        backend_timeout_seconds=int(os.getenv("BACKEND_TIMEOUT_SECONDS", "15")),
        max_model_attempts=int(os.getenv("MAX_MODEL_ATTEMPTS", "2")),
    )
