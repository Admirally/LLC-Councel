"""Configuration for the LLM Council."""

import os
from dotenv import load_dotenv

load_dotenv()

# OpenRouter API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Council members - list of OpenRouter model identifiers
# Variety across providers:
#   - OpenAI: flagship + mini
#   - DeepSeek: strong value / reasoning
#   - Google: fast, well-rounded
COUNCIL_MODELS = [
    "openai/gpt-4.1-mini",        # OpenAI mini
    "openai/gpt-4.1",             # OpenAI main
    "deepseek/deepseek-chat",     # DeepSeek chat
    "google/gemini-2.5-flash",    # Google Gemini flash
]

# Chairman model (default – will often be overridden dynamically
# by the best-ranked model from Stage 2)
CHAIRMAN_MODEL = "openai/gpt-4.1"

# OpenRouter API endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Data directory for conversation storage
DATA_DIR = "data/conversations"
