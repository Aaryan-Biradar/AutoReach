"""
AutoReach — Vapi Outbound Phone Call (CLI)
Calls the customer's phone directly using Riley.
"""

import requests
import time
import sys
import os

# ─── Load .env ─────────────────────────────────────────────────
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()

# ─── Configuration ─────────────────────────────────────────────
VAPI_PRIVATE_KEY     = os.environ.get("VAPI_PRIVATE_KEY", "")
ASSISTANT_ID         = os.environ.get("ASSISTANT_ID", "783ed2d8-bb1a-484a-8b5a-7eca088a1dab")
PHONE_NUMBER_ID      = os.environ.get("PHONE_NUMBER_ID", "884ab11a-1f94-4f32-b8fa-ce0ffe29023c")
CUSTOMER_PHONE_NUMBER = os.environ.get("CUSTOMER_PHONE_NUMBER", "")

if not VAPI_PRIVATE_KEY:
    print("[!] VAPI_PRIVATE_KEY must be set in .env")
    sys.exit(1)

if not CUSTOMER_PHONE_NUMBER:
    print("[!] CUSTOMER_PHONE_NUMBER must be set in .env (E.164 format, e.g. +17537503694)")
    sys.exit(1)

BASE_URL = "https://api.vapi.ai"

HEADERS = {
    "Authorization": f"Bearer {VAPI_PRIVATE_KEY}",
    "Content-Type": "application/json"
}

# ─── Assistant config (inline JSON) ───────────────────────────
# Using assistantId for now. To use a fully inline/transient assistant
# (e.g. with dynamic system prompts from LangChain RAG), replace
# "assistantId" with an "assistant" dict containing the full config.
CALL_PAYLOAD = {
    "assistantId": ASSISTANT_ID,
    "phoneNumberId": PHONE_NUMBER_ID,
    "customer": {
        "number": CUSTOMER_PHONE_NUMBER
    }
}


def start_phone_call():
    print(f"[*] Calling {CUSTOMER_PHONE_NUMBER} with Riley (assistant {ASSISTANT_ID})...")
    print(f"[*] Caller ID: phone number {PHONE_NUMBER_ID}\n")

    response = requests.post(
        f"{BASE_URL}/call",
        headers=HEADERS,
        json=CALL_PAYLOAD
    )

    if response.status_code != 201:
        print(f"[!] Error creating call: {response.status_code}")
        print(response.text)
        sys.exit(1)

    data = response.json()
    call_id = data.get("id")
    print(f"[OK] Call created! ID: {call_id}")
    return call_id


def poll_call_status(call_id):
    print("\n[*] Waiting for the call to connect and complete...")
    print("[*] (Monitoring status...)\n")

    last_status = None
    last_message_count = 0

    while True:
        response = requests.get(f"{BASE_URL}/call/{call_id}", headers=HEADERS)
        if response.status_code != 200:
            print(f"\n[!] Error polling status: {response.text}")
            break

        data = response.json()
        status = data.get("status")

        if status != last_status:
            print(f"\n[Status] {status.capitalize()}")
            last_status = status

        messages = data.get("messages", [])
        if messages and len(messages) > last_message_count:
            for msg in messages[last_message_count:]:
                role = msg.get("role", "unknown")
                # Depending on the schema, text might be in 'message', 'text', or 'content'
                text = msg.get("message") or msg.get("content") or msg.get("text") or ""
                # Vapi sometimes includes non-conversation messages; filter for actual chat
                if role in ["user", "assistant", "bot", "customer"] and text:
                    print(f"\n{role.capitalize()}: {text}")
            last_message_count = len(messages)

        if status in ["ended", "completed", "failed"]:
            print("\n\n" + "=" * 50)
            print(" FINAL TRANSCRIPT ")
            print("=" * 50)
            final_transcript = data.get("transcript", "")
            print(final_transcript if final_transcript else "No transcript available.")
            print("=" * 50)
            break

        time.sleep(3)


if __name__ == "__main__":
    call_id = start_phone_call()

    try:
        poll_call_status(call_id)
    except KeyboardInterrupt:
        print("\n[!] Stopped polling. You can check the transcript in the Vapi dashboard.")
