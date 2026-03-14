import json
import logging
import time
import uuid

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from services.langchain_agent import get_agent_response
from services.call_events import push_event

logger = logging.getLogger(__name__)

router = APIRouter()


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

@router.post("/vapi/webhook")
async def vapi_webhook(request: Request):
    body = await request.json()

    message = body.get("message", body)
    if not isinstance(message, dict):
        return {"ok": True}

    msg_type = message.get("type", "unknown")
    call_id = message.get("call", {}).get("id")

    logger.info("Vapi webhook — type=%s call=%s", msg_type, call_id)

    if call_id and msg_type in ("transcript", "status-update", "end-of-call-report", "conversation-update"):
        push_event(call_id, message)

    return {"ok": True}
