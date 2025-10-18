# config.py
import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    frontend_url: str

    # class Config:
    #     env_file = Path(".env")

settings = Settings()
