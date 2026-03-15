# AutoReach

## Project Structure

```
AutoReach/
├── .env
├── docker-compose.yml
├── README.md
├── backend/
│   ├── main.py                  ← FastAPI entry point (Person 3)
│   ├── database.py              ← SQLAlchemy models + session (Person 3)
│   ├── routes/
│   │   ├── dashboard.py         ← Frontend-facing API endpoints (Person 3)
│   │   └── vapi_webhook.py      ← Receives Vapi call webhooks (Person 1)
│   ├── services/
│   │   ├── langchain_agent.py   ← LangChain reasoning logic (Person 2)
│   │   └── rag_retriever.py     ← Vector search against pgvector (Person 2)
│   └── rag/
│       └── documents/
│           ├── call_script.txt
│           ├── foodbank_faq.txt
│           ├── objection_responses.txt
│           └── pickup_logistics.txt
└── frontend/
    └── app/
        ├── page.tsx              ← Main dashboard page (Person 3)
        ├── layout.tsx
        ├── components/
        │   ├── CallLog.tsx       ← Live call log with badges (Person 3)
        │   ├── OttawaMap.tsx     ← Leaflet map of Ottawa (Person 3)
        │   └── StatCards.tsx     ← Summary metric cards (Person 3)
        └── lib/
            └── api.ts            ← Central fetch functions (Person 3)
```

---

## Prerequisites

Before you start, make sure you have the following installed on your machine.

**Docker Desktop** — this runs your database and services in containers so everyone has an identical environment. Download it at [docker.com](https://www.docker.com/products/docker-desktop).

**Node.js (v20+)** — needed to run the Next.js frontend locally. Check with `node -v`. Download at [nodejs.org](https://nodejs.org).

**Python 3.14** — the backend uses Python. Check with `python3 --version`. Download at [python.org](https://www.python.org).

**uv** — a fast Python package manager that replaces pip. Install it by running:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone <repo-url>
cd AutoReach
```

### 2. Set up your environment variables

The project needs API keys and database credentials to run. Copy the example env file and edit it, or create a `.env` file at the **root** of the project (next to `docker-compose.yml`):

```bash
cp .env.example .env
```

Then open it and add the following. Ask a teammate for the actual values if you don't have them yet:

```env
# Database — this connects your backend to the PostgreSQL container
DATABASE_URL=postgresql://postgres:password@db:5432/autoreach

# Vapi — the voice calling service
VAPI_PRIVATE_KEY=your_vapi_private_key_here
ASSISTANT_ID=your_assistant_id_here
PHONE_NUMBER_ID=your_phone_number_id_here
CUSTOMER_PHONE_NUMBER=+1XXXXXXXXXX

# OpenAI — used for embeddings and the Railtracks agent
OPENAI_API_KEY=your_openai_key_here

# Ngrok — required when running the full stack with Docker (see "Run with Docker + ngrok" below)
# Get your token at https://dashboard.ngrok.com/get-started/your-authtoken
NGROK_AUTHTOKEN=your_ngrok_authtoken_here
```

### 3. Start the database with Docker

From the root of the project, run:

```bash
docker compose up db
```

This spins up just the PostgreSQL database. You'll see it say "ready to accept connections" when it's done. Keep this terminal open (or run it with `-d` to run it in the background).

### 4. Set up and run the backend

Open a new terminal and navigate into the backend folder:

```bash
cd backend
```

Install Python dependencies using uv. This reads `pyproject.toml` and installs everything in one shot:

```bash
uv sync
```

Start the FastAPI server with hot-reload (it restarts automatically when you save a file):

```bash
uv run uvicorn main:app --reload
```

The backend will now be running at [http://localhost:8000](http://localhost:8000). You can visit [http://localhost:8000/docs](http://localhost:8000/docs) to see all the API endpoints in an interactive UI — useful for testing without a frontend.

### 5. Set up and run the frontend

Open another new terminal and navigate into the frontend folder:

```bash
cd frontend
```

Install JavaScript dependencies:

```bash
npm install
```

Start the Next.js development server:

```bash
npm run dev
```

The frontend will be running at [http://localhost:3000](http://localhost:3000).

---

## Running Everything at Once (Docker)

If you want to run the entire stack — database, backend, frontend, and **ngrok** — with a single command, use Docker Compose.

### Run with Docker + ngrok (recommended for voice calls)

Voice calls need a public URL so Vapi can reach the backend for `/chat/completions` and webhooks. The Compose stack includes an **ngrok** service that tunnels to the backend.

1. **Set `NGROK_AUTHTOKEN` in `.env`**  
   Sign up at [ngrok.com](https://ngrok.com) (free tier is enough), then copy your authtoken from [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken) and add to `.env`:
   ```env
   NGROK_AUTHTOKEN=your_ngrok_authtoken_here
   ```
2. From the project root, run:
   ```bash
   docker compose up --build
   ```
3. Wait a few seconds for ngrok to establish the tunnel. The backend will read the public URL from the ngrok container’s API when you start a call.
4. Open the app at [http://localhost:3000](http://localhost:3000) and use “Start call” as usual. The ngrok inspector is at [http://localhost:4040](http://localhost:4040) for debugging.

If `NGROK_AUTHTOKEN` is missing, the ngrok container will exit with an error; add the token and run `docker compose up` again.

### Run without ngrok (DB + backend + frontend only)

To run only the database, backend, and frontend (no tunnel):

```bash
docker compose up db backend frontend
```

You won’t be able to place voice calls unless you run ngrok separately on the host and set `NGROK_URL` in `.env` to your tunnel URL.

### Stop everything

Press `Ctrl+C` or run:

```bash
docker compose down
```

