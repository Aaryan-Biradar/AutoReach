"""Smee.io helpers for relaying Vapi webhooks over SSE."""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator

import httpx

logger = logging.getLogger(__name__)

SMEE_NEW_URL = "https://smee.io/new"


async def get_smee_url() -> str:
    """Create a fresh ephemeral Smee channel and return its URL."""
    async with httpx.AsyncClient(follow_redirects=False) as client:
        resp = await client.get(SMEE_NEW_URL)
        if resp.status_code in (301, 302):
            return resp.headers["Location"]
        # Fallback: follow redirects and use the final URL
        resp2 = await client.head(SMEE_NEW_URL, follow_redirects=True)
        return str(resp2.url)


async def stream_smee_events(
    smee_url: str,
    call_id: str | None = None,
) -> AsyncIterator[dict]:
    """Async generator: connect to a Smee relay and yield Vapi message dicts.

    Each yielded dict is a raw Vapi server-message payload containing at least
    a ``type`` key (``"transcript"``, ``"status-update"``, ``"end-of-call-report"``,
    etc.).  The generator closes itself when an end-of-call signal is received.
    """
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream(
            "GET",
            smee_url,
            headers={
                "Accept": "text/event-stream",
                "Cache-Control": "no-cache",
            },
        ) as resp:
            resp.raise_for_status()
            logger.info("Connected to Smee SSE stream at %s", smee_url)

            event_type = "message"
            data_lines: list[str] = []
            buf = ""

            async for chunk in resp.aiter_text():
                buf += chunk

                while "\n" in buf:
                    line, buf = buf.split("\n", 1)
                    line = line.rstrip("\r")

                    if line == "":
                        if data_lines:
                            msg = _extract_vapi_message(
                                event_type, "\n".join(data_lines), call_id
                            )
                            if msg is not None:
                                yield msg
                                if _is_call_end(msg):
                                    return
                        event_type = "message"
                        data_lines = []
                    elif line.startswith("event:"):
                        event_type = line[len("event:") :].strip()
                    elif line.startswith("data:"):
                        data_lines.append(line[len("data:") :].lstrip(" "))


def _extract_vapi_message(
    event_type: str, data_str: str, call_id: str | None
) -> dict | None:
    """Parse a single Smee SSE event and return the inner Vapi message, or None."""
    if event_type in ("ping", "ready"):
        return None

    try:
        data = json.loads(data_str)
    except json.JSONDecodeError:
        return None

    payload = data.get("body", data)
    message = payload.get("message") if isinstance(payload, dict) else None

    if not message or not isinstance(message, dict):
        return None

    event_call_id = message.get("call", {}).get("id")
    if call_id and event_call_id and event_call_id != call_id:
        return None

    return message


def _is_call_end(message: dict) -> bool:
    msg_type = message.get("type")
    if msg_type == "end-of-call-report":
        return True
    if msg_type == "status-update" and message.get("status") in (
        "ended",
        "completed",
        "failed",
        "canceled",
    ):
        return True
    return False
