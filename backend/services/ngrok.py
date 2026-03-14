"""Ngrok helper — reads the public HTTPS tunnel URL from ngrok's local API."""

import logging
import os

import httpx

logger = logging.getLogger(__name__)

NGROK_HOSTS = [
    "http://localhost:4040",
    "http://host.docker.internal:4040",
]


async def get_ngrok_url() -> str:
    """Return the public HTTPS URL of the running ngrok tunnel on port 8000.

    Tries localhost first (host execution), then host.docker.internal (Docker).
    Also checks the NGROK_URL environment variable as a manual override.
    """
    override = os.getenv("NGROK_URL")
    if override:
        logger.info("Using NGROK_URL env override: %s", override)
        return override.rstrip("/")

    last_exc: Exception | None = None
    for host in NGROK_HOSTS:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(f"{host}/api/tunnels", timeout=3)
                resp.raise_for_status()
            tunnels = resp.json().get("tunnels", [])
            for t in tunnels:
                if t.get("proto") == "https":
                    url = t["public_url"]
                    logger.info("ngrok HTTPS tunnel (via %s): %s", host, url)
                    return url
            if tunnels:
                url = tunnels[0]["public_url"]
                logger.info("ngrok tunnel fallback (via %s): %s", host, url)
                return url
        except Exception as exc:
            last_exc = exc
            continue

    raise RuntimeError(
        "Cannot reach ngrok — is `ngrok http 8000` running? "
        f"Last error: {last_exc}"
    )
