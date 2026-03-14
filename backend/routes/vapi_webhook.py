import logging

from fastapi import APIRouter
from pydantic import BaseModel

from services.langchain_agent import get_agent_response

logger = logging.getLogger(__name__)

router = APIRouter()


class Message(BaseModel):
    role: str
    content: str


class VapiRequest(BaseModel):
    message: list[Message]


class VapiResponse(BaseModel):
    response: str


@router.get("/api/rag/test")
async def test_rag(q: str = "objection handling"):
    from services.rag_retriever import retrieve_context, _get_store

    store = _get_store()
    return {
        "vector_count": store.count(),
        "query": q,
        "results": retrieve_context(q, top_k=4),
    }


@router.post("/vapi/webhook", response_model=VapiResponse)
async def vapi_webhook(req: VapiRequest):
    logger.info(
        "Vapi webhook received — %d message(s) in conversation",
        len(req.message),
    )

    try:
        conversation = [{"role": m.role, "content": m.content} for m in req.message]
        response_text = await get_agent_response(conversation)
        logger.info("Agent response: %s", response_text[:200])
        return VapiResponse(response=response_text)
    except Exception:
        logger.exception("Agent error — returning fallback response")
        return VapiResponse(
            response="I appreciate your time. Could you hold on just one moment?"
        )
