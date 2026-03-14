"""In-memory per-call event bus for relaying Vapi webhook events to the frontend SSE stream."""

import asyncio
import logging

logger = logging.getLogger(__name__)

_queues: dict[str, asyncio.Queue] = {}


def get_queue(call_id: str) -> asyncio.Queue:
    """Return (and lazily create) the event queue for a given call."""
    if call_id not in _queues:
        _queues[call_id] = asyncio.Queue()
    return _queues[call_id]


def push_event(call_id: str, event: dict) -> None:
    """Push a Vapi event into the call's queue (non-blocking)."""
    q = _queues.get(call_id)
    if q is None:
        logger.debug("No listener for call %s — dropping event %s", call_id, event.get("type"))
        return
    q.put_nowait(event)


def remove_queue(call_id: str) -> None:
    """Clean up the queue when a call ends."""
    _queues.pop(call_id, None)
