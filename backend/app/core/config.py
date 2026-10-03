from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    GROQ_API_KEY: str
    DEBUG: bool = False
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    REQUEST_TIMEOUT: int = 120

    model_config = {"env_file": ".env", "case_sensitive": False, "extra": "ignore"}

settings = Settings()
