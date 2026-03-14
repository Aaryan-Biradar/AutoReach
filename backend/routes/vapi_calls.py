import json
import logging
import os

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.smee import get_smee_url, stream_smee_events

logger = logging.getLogger(__name__)

router = APIRouter()

VAPI_BASE = "https://api.vapi.ai"
VAPI_PRIVATE_KEY = os.getenv("VAPI_PRIVATE_KEY", "")
ASSISTANT_ID = os.getenv("ASSISTANT_ID", "")
PHONE_NUMBER_ID = os.getenv("PHONE_NUMBER_ID", "")
CUSTOMER_PHONE_NUMBER = os.getenv("CUSTOMER_PHONE_NUMBER", "")

# In-memory map: call_id -> { smee_url }
_active_calls: dict[str, dict] = {}


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

    A fresh Smee.io relay URL is generated so Vapi can POST live transcript
    and status webhooks to it.  The frontend can then open an EventSource on
    ``/api/calls/{call_id}/stream`` to receive those events in real time.
    """
    target_number = (
        req.phone_number if req and req.phone_number else CUSTOMER_PHONE_NUMBER
    )
    if not target_number:
        raise HTTPException(status_code=400, detail="No phone number provided")

    smee_url = await get_smee_url()
    logger.info("Generated Smee URL for call: %s", smee_url)

    payload = {
        "assistantId": ASSISTANT_ID,
        "phoneNumberId": PHONE_NUMBER_ID,
        "customer": {"number": target_number},
        "assistantOverrides": {
            "server": {"url": smee_url},
            "serverMessages": [
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

    _active_calls[call_id] = {"smee_url": smee_url}

    return StartCallResponse(call_id=call_id, status=data.get("status", "queued"))


@router.get("/calls/{call_id}/stream")
async def stream_call(call_id: str):
    """SSE endpoint that relays live Vapi transcript/status events to the frontend."""
    entry = _active_calls.get(call_id)
    if not entry:
        raise HTTPException(
            status_code=404,
            detail="No active call found — was it started via /calls/start?",
        )

    smee_url = entry["smee_url"]

    async def event_generator():
        try:
            async for message in stream_smee_events(smee_url, call_id):
                payload = json.dumps(message, default=str)
                yield f"data: {payload}\n\n"
        except Exception:
            logger.exception("SSE stream error for call %s", call_id)
        finally:
            _active_calls.pop(call_id, None)

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

    Kept as a fallback; the SSE ``/stream`` endpoint above is preferred.
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
