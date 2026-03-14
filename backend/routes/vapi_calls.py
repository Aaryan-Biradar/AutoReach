import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

VAPI_BASE = "https://api.vapi.ai"
VAPI_PRIVATE_KEY = os.getenv("VAPI_PRIVATE_KEY", "")
ASSISTANT_ID = os.getenv("ASSISTANT_ID", "")
PHONE_NUMBER_ID = os.getenv("PHONE_NUMBER_ID", "")
CUSTOMER_PHONE_NUMBER = os.getenv("CUSTOMER_PHONE_NUMBER", "")


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
    """Trigger an outbound phone call via the Vapi REST API."""
    target_number = (req.phone_number if req and req.phone_number else CUSTOMER_PHONE_NUMBER)
    if not target_number:
        raise HTTPException(status_code=400, detail="No phone number provided")

    payload = {
        "assistantId": ASSISTANT_ID,
        "phoneNumberId": PHONE_NUMBER_ID,
        "customer": {"number": target_number},
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
    return StartCallResponse(call_id=data["id"], status=data.get("status", "queued"))


@router.get("/calls/{call_id}/listen")
async def listen_call(call_id: str):
    """Poll the Vapi API for the current call status, messages, and transcript."""
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
