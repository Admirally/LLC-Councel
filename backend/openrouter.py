"""OpenRouter API client for making LLM requests."""

import httpx
import asyncio
from typing import List, Dict, Any, Optional
from .config import OPENROUTER_API_KEY, OPENROUTER_API_URL


async def query_model(
    model: str,
    messages: List[Dict[str, str]],
    timeout: float = 120.0,
) -> Optional[Dict[str, Any]]:
    """
    Query a single model via OpenRouter API.

    Args:
        model: OpenRouter model identifier (e.g., "openai/gpt-4o")
        messages: List of message dicts with 'role' and 'content'
        timeout: Request timeout in seconds

    Returns:
        Response dict with 'content' and optional 'reasoning_details', or None if failed
    """
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": messages,
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                OPENROUTER_API_URL,
                headers=headers,
                json=payload,
            )

        # Log non-200 responses explicitly
        if resp.status_code != 200:
            print(
                f"[OpenRouter] {model} FAILED "
                f"status={resp.status_code} "
                f"body={resp.text[:200]!r}"
            )
            return None

        data = resp.json()
        message = data["choices"][0]["message"]

        print(f"[OpenRouter] {model} SUCCESS")
        return {
            "content": message.get("content"),
            "reasoning_details": message.get("reasoning_details"),
        }

    except Exception as e:
        print(f"[OpenRouter] {model} ERROR: {e}")
        return None


async def query_models_parallel(
    models: List[str],
    messages: List[Dict[str, str]],
) -> Dict[str, Optional[Dict[str, Any]]]:
    """
    Query multiple models in parallel.

    Args:
        models: List of OpenRouter model identifiers
        messages: List of message dicts to send to each model

    Returns:
        Dict mapping model identifier to response dict (or None if failed)
    """
    print("[COUNCIL] query_models_parallel – models:", models)

    # Create tasks for all models with logging
    tasks: Dict[str, asyncio.Task] = {}
    for model in models:
        print(f"[COUNCIL] scheduling call to model: {model}")
        tasks[model] = asyncio.create_task(query_model(model, messages))

    responses: Dict[str, Optional[Dict[str, Any]]] = {}
    for model, task in tasks.items():
        try:
            result = await task
            responses[model] = result

            if result is None:
                print(f"[COUNCIL] model {model} -> result=None")
            else:
                print(f"[COUNCIL] model {model} -> result OK")
        except Exception as e:
            print(f"[COUNCIL] ERROR waiting for model {model}: {e}")
            responses[model] = None

    return responses
