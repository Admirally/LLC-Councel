This repo came out of a simple frustration: instead of asking one LLM a question and hoping it gets it right, I wanted to see how multiple models think about the same problem side by side.

LLM Council is a small, local web app (ChatGPT-style UI) that sends a single prompt to several LLMs via OpenRouter, lets them review each other’s responses, and then produces a final answer using a designated “Chairman” model. The goal isn’t optimization or benchmarking — it’s to surface differences in reasoning, blind spots, and consensus.

At a high level, this is what happens when you submit a prompt:

Stage 1: First opinions
The prompt is sent to each model independently. Their responses are collected and shown in separate tabs so you can read them without synthesis or filtering.

Stage 2: Review
Each model is shown the other models’ responses (with identities anonymized) and asked to evaluate and rank them based on accuracy and insight.

Stage 3: Final response
A designated Chairman model reviews everything and produces a single consolidated answer.

Notes

This was mostly a weekend experiment to explore how different LLMs reason when asked the same question, especially for ambiguous or judgment-heavy problems. It’s intentionally simple and not actively maintained. Treat it as a sandbox or reference implementation — feel free to modify it however you want.

Setup
1. Install dependencies

The project uses uv for Python dependency management.

Backend:

uv sync


Frontend:

cd frontend
npm install
cd ..

2. Configure API key

Create a .env file in the project root:

OPENROUTER_API_KEY=sk-or-v1-...


You can get an API key from openrouter.ai. Make sure your account has sufficient credits.

3. Configure models (optional)

Edit backend/config.py to change which models participate in the council:

COUNCIL_MODELS = [
    "openai/gpt-5.1",
    "google/gemini-3-pro-preview",
    "anthropic/claude-sonnet-4.5",
    "x-ai/grok-4",
]

CHAIRMAN_MODEL = "google/gemini-3-pro-preview"

Running the app

Option 1: start script

./start.sh


Option 2: run manually

Backend:

uv run python -m backend.main


Frontend:

cd frontend
npm run dev


Then open http://localhost:5173
.

Tech stack

Backend: FastAPI (Python 3.10+), async httpx, OpenRouter API

Frontend: React + Vite, react-markdown

Storage: JSON files under data/conversations/

Package management: uv (Python), npm (JS)

