import asyncio
import os
import sys
import json
import threading
import time
import requests

from vapi import Vapi
from vapi.types import CreateCustomerDto, AssistantOverrides, Server, Call as VapiCall

from services.smee import get_smee_url as _async_get_smee_url

# ─── Load .env ─────────────────────────────────────────────────
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()

VAPI_PRIVATE_KEY      = os.environ.get("VAPI_PRIVATE_KEY", "")
ASSISTANT_ID          = os.environ.get("ASSISTANT_ID", "783ed2d8-bb1a-484a-8b5a-7eca088a1dab")
PHONE_NUMBER_ID       = os.environ.get("PHONE_NUMBER_ID", "884ab11a-1f94-4f32-b8fa-ce0ffe29023c")
CUSTOMER_PHONE_NUMBER = os.environ.get("CUSTOMER_PHONE_NUMBER", "")

if not VAPI_PRIVATE_KEY or not CUSTOMER_PHONE_NUMBER:
    print("[!] VAPI_PRIVATE_KEY and CUSTOMER_PHONE_NUMBER must be set in .env")
    sys.exit(1)

call_active = True
call_id = None


def get_smee_url() -> str:
    """Thin sync wrapper around the shared async helper."""
    return asyncio.run(_async_get_smee_url())


def parse_sse_events(response):
    """Yield (event_type, data_string) tuples from a streaming SSE response."""
    event_type = "message"
    data_lines: list[str] = []
    buf = ""

    for chunk in response.iter_content(decode_unicode=True):
        buf += chunk
        while "\n" in buf:
            line, buf = buf.split("\n", 1)
            line = line.rstrip("\r")

            if line == "":
                if data_lines:
                    yield event_type, "\n".join(data_lines)
                event_type = "message"
                data_lines = []
            elif line.startswith("event:"):
                event_type = line[len("event:"):].strip()
            elif line.startswith("data:"):
                data_lines.append(line[len("data:"):].lstrip(" "))


def process_message(message):
    """Handle a single Vapi server message. Returns True if the call has ended."""
    global call_active

    msg_type = message.get("type")
    last_partial = getattr(process_message, "_last_partial", "")

    if msg_type == "transcript":
        role = message.get("role", "unknown").capitalize()
        transcript = message.get("transcript", "")
        transcript_type = message.get("transcriptType", "partial")

        if transcript_type == "partial":
            sys.stdout.write(f"\r{role}: {transcript}...")
            sys.stdout.flush()
            process_message._last_partial = transcript
        else:
            sys.stdout.write("\r" + " " * (len(role) + len(last_partial) + 10) + "\r")
            print(f"{role}: {transcript}")
            process_message._last_partial = ""

    elif msg_type == "status-update":
        status = message.get("status")
        if status:
            print(f"\n[Status] {status.capitalize()}")
        if status in ("ended", "completed", "failed", "canceled"):
            call_active = False
            return True

    elif msg_type == "end-of-call-report":
        print("\n\n" + "=" * 50)
        print(" FINAL END OF CALL REPORT ")
        print("=" * 50)
        summary = message.get("summary", "No summary available.")
        print(f"Summary: {summary}\n")
        ended_reason = message.get("endedReason", "")
        if ended_reason:
            print(f"Ended reason: {ended_reason}")
        cost = message.get("cost")
        if cost is not None:
            print(f"Cost: ${cost:.4f}")
        duration = message.get("durationSeconds")
        if duration is not None:
            print(f"Duration: {duration:.0f}s")
        print("=" * 50)
        call_active = False
        return True

    return False

process_message._last_partial = ""


def listen_to_smee(smee_url):
    global call_active

    print(f"[*] Connecting to Smee relay at {smee_url}...")

    resp = requests.get(smee_url, stream=True, headers={
        "Accept": "text/event-stream",
        "Cache-Control": "no-cache",
    })
    resp.raise_for_status()
    print("[OK] Connected to Smee SSE stream.")

    for event_type, data_str in parse_sse_events(resp):
        if not call_active:
            break

        if event_type == "ping" or event_type == "ready":
            continue

        try:
            data = json.loads(data_str)
        except json.JSONDecodeError:
            continue

        # Smee wraps the original webhook POST in a "body" key
        payload = data.get("body", data)
        message = payload.get("message") if isinstance(payload, dict) else None

        if not message or not isinstance(message, dict):
            continue

        event_call_id = message.get("call", {}).get("id")
        if call_id and event_call_id and event_call_id != call_id:
            continue

        if process_message(message):
            break


def poll_call_status(vapi_client, cid, interval=5):
    """Fallback: poll Vapi API to detect call end if Smee misses the event."""
    global call_active
    time.sleep(interval)
    while call_active:
        try:
            result = vapi_client.calls.get(cid)
            status = getattr(result, "status", None)
            if status in ("ended", "completed", "failed"):
                if call_active:
                    print(f"\n[Status via API] {status.capitalize()}")
                    call_active = False
                break
        except Exception:
            pass
        time.sleep(interval)


if __name__ == "__main__":
    print("[*] Generating ephemeral webhook URL via Smee.io...")
    webhook_url = get_smee_url()

    listener_thread = threading.Thread(target=listen_to_smee, args=(webhook_url,), daemon=True)
    listener_thread.start()

    time.sleep(2)

    vapi_client = Vapi(token=VAPI_PRIVATE_KEY)

    print(f"\n[*] Calling {CUSTOMER_PHONE_NUMBER} with Riley (assistant {ASSISTANT_ID})...")
    print("[*] Live transcripts will appear below as the conversation happens.\n")

    try:
        call = vapi_client.calls.create(
            assistant_id=ASSISTANT_ID,
            customer=CreateCustomerDto(number=CUSTOMER_PHONE_NUMBER),
            phone_number_id=PHONE_NUMBER_ID,
            assistant_overrides=AssistantOverrides(
                server=Server(url=webhook_url),
                server_messages=["transcript", "status-update", "end-of-call-report"],
            ),
        )
        if isinstance(call, VapiCall):
            call_id = call.id
            print(f"[OK] Call created! ID: {call_id}\n")
        else:
            print("[OK] Batch call created!\n")

    except Exception as e:
        print(f"[!] Error creating call: {e}")
        sys.exit(1)

    # Fallback poller — catches call end even if the Smee stream drops it
    if call_id:
        poller = threading.Thread(
            target=poll_call_status, args=(vapi_client, call_id), daemon=True
        )
        poller.start()

    print("[*] (Monitoring status...)\n")

    try:
        while call_active:
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\n[!] Stopped by user.")

    print("\n[OK] Call ended. Cleaning up...")
    sys.exit(0)
