import asyncio
import json
import logging
import os

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.ngrok import get_ngrok_url
from services.call_events import get_queue, remove_queue

logger = logging.getLogger(__name__)

router = APIRouter()

VAPI_BASE = "https://api.vapi.ai"
VAPI_PRIVATE_KEY = os.getenv("VAPI_PRIVATE_KEY", "")
ASSISTANT_ID = os.getenv("ASSISTANT_ID", "")
PHONE_NUMBER_ID = os.getenv("PHONE_NUMBER_ID", "")
CUSTOMER_PHONE_NUMBER = (os.getenv("CUSTOMER_PHONE_NUMBER") or "").strip()

_active_calls: set[str] = set()


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {VAPI_PRIVATE_KEY}",
        "Content-Type": "application/json",
    }


class StartCallRequest(BaseModel):
    phone_number: str | None = None


class StartCallResponse(BaseModel):
    call_id: str
    status: str


@router.post("/calls/start", response_model=StartCallResponse)
async def start_call(req: StartCallRequest | None = None):
    """Trigger an outbound phone call via the Vapi REST API.

    Uses ngrok to expose our server so Vapi can:
      1. POST /chat/completions for LLM responses (custom-llm)
      2. POST /vapi/webhook for transcript/status events
    The frontend opens an EventSource on /api/calls/{call_id}/stream.
    """
    # Queue Call from dashboard sends no phone_number; we use CUSTOMER_PHONE_NUMBER from .env
    raw = (req.phone_number if req and req.phone_number else CUSTOMER_PHONE_NUMBER) or ""
    target_number = raw.strip() if isinstance(raw, str) else ""
    if not target_number:
        logger.warning("POST /calls/start — no phone number (set CUSTOMER_PHONE_NUMBER in .env or send phone_number in body)")
        raise HTTPException(status_code=400, detail="No phone number provided. Set CUSTOMER_PHONE_NUMBER in .env or send { \"phone_number\": \"+1...\" } in the request body.")

    ngrok_url = await get_ngrok_url()
    logger.info("Using ngrok tunnel: %s", ngrok_url)

    payload = {
        "assistantId": ASSISTANT_ID,
        "phoneNumberId": PHONE_NUMBER_ID,
        "customer": {"number": target_number},
        "assistantOverrides": {
            "model": {
                "provider": "custom-llm",
                "url": ngrok_url,
                "model": "railtracks-alex",
            },
            "server": {"url": f"{ngrok_url}/vapi/webhook"},
            "serverMessages": [
                "conversation-update",
                "transcript",
                "status-update",
                "end-of-call-report",
            ],
        },
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{VAPI_BASE}/call",
            headers=_headers(),
            json=payload,
            timeout=15,
        )

    if resp.status_code != 201:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"Vapi error: {resp.text}",
        )

    data = resp.json()
    call_id = data["id"]

    # Pre-create the event queue so webhook events aren't dropped
    get_queue(call_id)
    _active_calls.add(call_id)

    return StartCallResponse(call_id=call_id, status=data.get("status", "queued"))


@router.get("/calls/{call_id}/stream")
async def stream_call(call_id: str):
    """SSE endpoint that relays live Vapi webhook events to the frontend."""
    if call_id not in _active_calls:
        raise HTTPException(
            status_code=404,
            detail="No active call found — was it started via /calls/start?",
        )

    queue = get_queue(call_id)

    async def event_generator():
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=60)
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
                    continue

                payload = json.dumps(event, default=str)
                yield f"data: {payload}\n\n"

                msg_type = event.get("type", "")
                if msg_type == "end-of-call-report":
                    break
                
                status_val = event.get("status") or event.get("call", {}).get("status")
                if msg_type == "status-update" and status_val in (
                    "ended", "completed", "failed", "canceled",
                ):
                    break
        except asyncio.CancelledError:
            pass
        finally:
            _active_calls.discard(call_id)
            remove_queue(call_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/calls/{call_id}/listen")
async def listen_call(call_id: str):
    """Poll the Vapi API for the current call status, messages, and transcript.

    Kept as a fallback; the SSE /stream endpoint above is preferred.
    """
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{VAPI_BASE}/call/{call_id}",
            headers=_headers(),
            timeout=10,
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"Vapi error: {resp.text}",
        )

    data = resp.json()

    messages = []
    for msg in data.get("messages", []) or []:
        role = msg.get("role", "")
        content = msg.get("message", "") or msg.get("content", "")
        if role and content:
            messages.append({"role": role, "text": content})

    return {
        "status": data.get("status", "unknown"),
        "endedReason": data.get("endedReason"),
        "transcript": data.get("transcript", ""),
        "messages": messages,
    }
