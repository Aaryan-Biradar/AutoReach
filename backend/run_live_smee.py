import os
import sys
import json
import threading
import time
import requests
import sseclient

from vapi import Vapi

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

def get_smee_url():
    # Smee.io provides a free unlimited webhook payload delivery service via SSE
    response = requests.head("https://smee.io/new", allow_redirects=True)
    return response.url

def listen_to_smee(smee_url):
    global call_active
    
    print(f"[*] Connecting to Smee relay at {smee_url}...")
    # Connect to the SSE stream of smee.io
    response = requests.get(smee_url, stream=True, headers={'Accept': 'text/event-stream'})
    client = sseclient.SSEClient(response)
    
    last_partial = ""

    for event in client.events():
        if event.event == 'ping':
            continue
            
        if not call_active:
            break
            
        try:
            # Smee wraps the original payload in the 'body' property of its event JSON
            data = json.loads(event.data)
            payload = data.get("body", {})
            message = payload.get("message", {})
            
            if not message:
                continue

            # Since Smee might receive older events or events from previous runs, 
            # we make sure it belongs to the current call if call_id is set
            event_call_id = message.get("call", {}).get("id")
            if call_id and event_call_id and event_call_id != call_id:
                continue
                
            msg_type = message.get("type")
            
            if msg_type == "transcript":
                role = message.get("role", "unknown").capitalize()
                transcript = message.get("transcript", "")
                transcript_type = message.get("transcriptType", "partial") # 'partial' or 'final'
                
                if transcript_type == "partial":
                    # For partials, we use carriage return to overwrite the line
                    # This creates a "live typing" effect
                    sys.stdout.write(f"\r{role}: {transcript}...")
                    sys.stdout.flush()
                    last_partial = transcript
                else: 
                    # For final transcripts, print a fresh line
                    # Clear the partial line first (hacky but works in terminal)
                    sys.stdout.write("\r" + " " * (len(role) + len(last_partial) + 10) + "\r")
                    print(f"{role}: {transcript}")
                    last_partial = ""
                    
            elif msg_type == "status-update":
                status = message.get("status")
                if status:
                    print(f"\n[Status] {status.capitalize()}")
                if status in ["ended", "completed", "failed", "canceled"]:
                    call_active = False                    
                    break
                    
            elif msg_type == "end-of-call-report":
                print("\n\n" + "=" * 50)
                print(" FINAL END OF CALL REPORT ")
                print("=" * 50)
                summary = message.get("summary", "No summary available.")
                print(f"Summary: {summary}\n")
                print("=" * 50)
                call_active = False
                break
                
        except json.JSONDecodeError:
            pass
        except Exception as e:
            # Log errors but don't stop the loop
            print(f"\n[!] Error processing event: {e}")

if __name__ == "__main__":
    print("[*] Generating ephemeral webhook URL via Smee.io...")
    webhook_url = get_smee_url()
    
    # Start listening to SSE events in the background
    listener_thread = threading.Thread(target=listen_to_smee, args=(webhook_url,), daemon=True)
    listener_thread.start()
    
    # We give it a moment to connect to Smee before making the call
    time.sleep(2)
    
    # Start Vapi Call using Official Server SDK
    vapi_client = Vapi(token=VAPI_PRIVATE_KEY)

    print(f"\n[*] Calling {CUSTOMER_PHONE_NUMBER} with Riley (assistant {ASSISTANT_ID})...")
    print(f"[*] Live Transcripts will appear below as the conversation happens.\n")
    
    try:
        # We explicitly enable the 'transcript' server message
        call = vapi_client.calls.create(
            assistant_id=ASSISTANT_ID,
            customer={
                "number": CUSTOMER_PHONE_NUMBER
            },
            phone_number_id=PHONE_NUMBER_ID,
            assistant_overrides={
                "server": {
                    "url": webhook_url
                },
                "serverMessages": ["transcript", "status-update", "end-of-call-report"]
            }
        )
        call_id = call.id
        print(f"[OK] Call created! ID: {call_id}\n")
        
    except Exception as e:
        print(f"[!] Error creating call: {e}")
        sys.exit(1)

    # Keep the main thread alive while we wait for the webhook to flag the call as finished
    print("[*] (Monitoring status...)\n")
    
    try:
        while call_active:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[!] Stopped by user.")
        
    print("\n[OK] Call ended. Cleaning up...")
    sys.exit(0)
