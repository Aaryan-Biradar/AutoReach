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


@router.post("/vapi/webhook", response_model=VapiResponse)
async def vapi_webhook(req: VapiRequest):
    logger.info(
        "Vapi webhook received — %d message(s) in conversation",
        len(req.message),
    )

    try:
        conversation = [{"role": m.role, "content": m.content} for m in req.message]
        response_text = await get_agent_response(conversation)
        return VapiResponse(response=response_text)
    except Exception:
        logger.exception("Agent error — returning fallback response")
        return VapiResponse(
            response="I appreciate your time. Could you hold on just one moment?"
        )
