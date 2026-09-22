import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:5289/api")