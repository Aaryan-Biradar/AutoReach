import os
import json
from openai import OpenAI

# ─── Load .env ─────────────────────────────────────────────────
# Handle both local standalone and docker-compose execution paths
for env_path in [
    os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"),
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
    "/.env",
]:
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip().strip("'\"")] = val.strip().strip("'\"")
        break

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def generate_follow_up_email(transcript):
    """
    Generates a professional follow-up email based on the call transcript.
    Returns a dictionary with 'subject' and 'body'.
    """
    prompt = f"""
    You are an assistant for 'Food for the Capital' (FFTC). Your executive is Alex.
    Based on the following call transcript between Alex and a manager, generate a professional follow-up email.
    
    Transcript:
    {transcript}
    
    The email should:
    1. Acknowledge any specific points of agreement or concern mentioned in the transcript.
    2. Be concise and professional.
    3. Include a clear subject line.
    
    Output the result in JSON format with two keys: 'subject' and 'body'.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a professional email composer."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        content = json.loads(response.choices[0].message.content)
        return content
    except Exception as e:
        print(f"[!] Failed to generate email with OpenAI: {e}")
        return {
            "subject": "Food for the Capital - Partnership Follow-up",
            "body": "Thank you for speaking with us earlier. We look forward to our partnership."
        }

if __name__ == "__main__":
    # Test
    test_transcript = "Alex: Hello, I hope you are doing well. I am calling from FFTC. Manager: Hi Alex. Alex: We wanted to discuss the partnership. Manager: Yes, I am interested."
    print(generate_follow_up_email(test_transcript))
