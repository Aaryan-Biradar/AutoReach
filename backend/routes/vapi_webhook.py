import json
import logging
import time
import uuid

from fastapi import APIRouter, Request, BackgroundTasks
from fastapi.responses import StreamingResponse

import os
from email_service import send_fftc_email
from llm_service import generate_follow_up_email

from services.langchain_agent import get_agent_response
from services.call_events import push_event, get_single_active_call_id

logger = logging.getLogger(__name__)

router = APIRouter()

def process_call_email(message: dict):
    # Try different locations for the transcript depending on Vapi event schema
    transcript = message.get("transcript", "")
    if not transcript:
        artifact = message.get("artifact", {})
        transcript = artifact.get("transcript", "")
        if not transcript:
            messages = artifact.get("messages", []) or message.get("messages", [])
            if messages:
                transcript = "\n".join(
                    f"{m.get('role', 'unknown').capitalize()}: {m.get('message', m.get('content', ''))}"
                    for m in messages if m.get('role') != 'system'
                )
                
    if not transcript:
        logger.warning("No transcript found to generate email.")
        return
        
    logger.info("Generating follow-up email from transcript...")
    try:
        email_data = generate_follow_up_email(transcript)
        subject = email_data.get("subject", "Automated Follow-up")
        body = email_data.get("body", "Thank you for your time.")
        
        manager_email = os.environ.get("MANAGER_EMAIL", "sidharth.sajan25@gmail.com")
        logger.info(f"Sending follow-up email to {manager_email}...")
        send_fftc_email(manager_email, subject, body)
    except Exception as e:
        logger.error(f"Failed to process call email: {e}")



# ---------------------------------------------------------------------------
# RAG smoke-test (GET /api/rag/test?q=...)
# ---------------------------------------------------------------------------

@router.get("/api/rag/test")
async def test_rag(q: str = "objection handling"):
    from services.rag_retriever import retrieve_context, store

    return {
        "vector_count": store.count(),
        "query": q,
        "results": retrieve_context(q, top_k=4),
    }


# ---------------------------------------------------------------------------
# OpenAI-compatible chat completions (POST /chat/completions)
#
# Vapi sends requests here when the assistant model is set to custom-llm.
# We run our Railtracks agent + RAG, then return an OpenAI-streaming response.
# ---------------------------------------------------------------------------

@router.post("/chat/completions")
async def chat_completions(request: Request):
    body = await request.json()
    messages = body.get("messages", [])
    logger.info("/chat/completions — %d messages received", len(messages))

    conversation: list[dict] = []
    for m in messages:
        role = m.get("role", "")
        content = m.get("content", "")
        if role == "system":
            continue
        if role and content:
            conversation.append({"role": role, "content": content})

    if not conversation:
        conversation = [{"role": "user", "content": "Hello"}]

    t0 = time.time()
    try:
        response_text = await get_agent_response(conversation)
    except Exception:
        logger.exception("Agent error in /chat/completions")
        response_text = "I appreciate your time. Could you hold on just one moment?"

    elapsed = int((time.time() - t0) * 1000)
    logger.info("/chat/completions — response in %dms: %s", elapsed, response_text[:120])

    completion_id = f"chatcmpl-{uuid.uuid4().hex[:12]}"
    created = int(time.time())

    async def stream_response():
        # First chunk: role
        chunk_role = {
            "id": completion_id,
            "object": "chat.completion.chunk",
            "created": created,
            "model": "railtracks-alex",
            "choices": [{"index": 0, "delta": {"role": "assistant"}, "finish_reason": None}],
        }
        yield f"data: {json.dumps(chunk_role)}\n\n"

        # Content chunk (full response in one go)
        chunk_content = {
            "id": completion_id,
            "object": "chat.completion.chunk",
            "created": created,
            "model": "railtracks-alex",
            "choices": [{"index": 0, "delta": {"content": response_text}, "finish_reason": None}],
        }
        yield f"data: {json.dumps(chunk_content)}\n\n"

        # Final chunk: finish_reason=stop
        chunk_stop = {
            "id": completion_id,
            "object": "chat.completion.chunk",
            "created": created,
            "model": "railtracks-alex",
            "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}],
        }
        yield f"data: {json.dumps(chunk_stop)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        stream_response(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ---------------------------------------------------------------------------
# Vapi webhook (POST /vapi/webhook)
#
# Receives all server-message events (transcript, status-update,
# end-of-call-report, conversation-update) and relays them to the
# in-memory event bus so the frontend SSE stream picks them up.
# ---------------------------------------------------------------------------

def _normalize_transcript_message(message: dict) -> dict:
    """Normalize Vapi transcript event so frontend always sees type/transcriptType and transcript.

    Vapi may send type as "transcript[transcriptType=\"final\"]" instead of
    type "transcript" + transcriptType "final". Transcript text may be in
    "transcript", "content", or artifact.messages. We set a canonical "transcript" key.
    """
    msg_type = message.get("type", "")
    if not msg_type.startswith("transcript"):
        return message

    out = dict(message)
    out["type"] = "transcript"
    if "transcriptType" not in out or not out["transcriptType"]:
        if 'transcriptType="final"' in msg_type or "final" in msg_type:
            out["transcriptType"] = "final"
        else:
            out["transcriptType"] = "partial"

    # Ensure frontend always has a "transcript" string from whichever key Vapi used
    if not (out.get("transcript") and str(out.get("transcript", "")).strip()):
        text = out.get("content")
        if text and isinstance(text, str):
            out["transcript"] = text.strip()
        else:
            artifact = out.get("artifact") or {}
            messages = artifact.get("messages") or []
            if messages:
                last = messages[-1] if isinstance(messages[-1], dict) else None
                if last:
                    text = last.get("message") or last.get("content") or ""
                    if isinstance(text, str):
                        out["transcript"] = text.strip()
            if not out.get("transcript"):
                out["transcript"] = ""

    return out


@router.post("/vapi/webhook")
async def vapi_webhook(request: Request, background_tasks: BackgroundTasks):
    body = await request.json()

    message = body.get("message", body)
    if not isinstance(message, dict):
        return {"ok": True}

    msg_type = message.get("type", "unknown")
    call = message.get("call") or body.get("call")
    call_id = call.get("id") if isinstance(call, dict) else None

    if msg_type.startswith("transcript"):
        message = _normalize_transcript_message(message)
        msg_type = "transcript"

    # Vapi sometimes omits "call" from transcript/status payloads; use the only active call as fallback
    if not call_id and msg_type in ("transcript", "status-update", "end-of-call-report"):
        call_id = get_single_active_call_id()

    if msg_type == "transcript":
        has_text = bool(message.get("transcript") and str(message.get("transcript", "")).strip())
        logger.info("Vapi webhook — type=transcript call=%s has_text=%s", call_id, has_text)
    else:
        logger.info("Vapi webhook — type=%s call=%s", msg_type, call_id)

    if call_id and msg_type in ("transcript", "status-update", "end-of-call-report", "conversation-update"):
        push_event(call_id, message)

    if msg_type == "end-of-call-report":
        background_tasks.add_task(process_call_email, message)

    return {"ok": True}


# ---------------------------------------------------------------------------
# POST / — Vapi sometimes sends server-message webhooks to the base URL
# instead of /vapi/webhook. Accept them here and handle the same way.
# ---------------------------------------------------------------------------

@router.post("/")
async def root_webhook(request: Request):
    return await vapi_webhook(request)
