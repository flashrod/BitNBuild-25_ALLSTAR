from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    SUPABASE_JWT_SECRET: str = ""

    model_config = {
        "extra": "allow"
    }

settings = Settings()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
