import logging

from fastapi import APIRouter
from pydantic import BaseModel

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

    # TODO(Person 2): Replace this placeholder with the LangChain agent call.
    # Pass req.message (the full conversation history) to the LangChain agent,
    # which will optionally search RAG, call GPT-4, and return the next
    # response for the voice agent to speak.
    return VapiResponse(
        response="Thanks for calling! We're still setting up our AI agent."
    )
