# AutoReach

## Inspiration  
  
We donated nearly 20,000 pounds of food to hungry families, but the hardest part wasn't moving literal tons of cans and boxes—it was getting grocery store managers to pick up the phone.   
  
Through our student-run nonprofit, Food for the Capital, we’ve raised over **$20,000** and logged **1,763 volunteer hours** to fight food insecurity. But the administrative logistics are paralyzing. Setting up a single grocery store donation booth takes an average of two weeks of back-and-forth phone tag. Every manual outreach call eats up 15 minutes of a volunteer's time.   
  
We realized that to scale our impact, we needed to completely eliminate this communication bottleneck.  
  
## What it does  
  
AutoReach is an end-to-end AI voice agent that autonomously coordinates food drives. It turns two weeks of manual phone tag into a single, two-minute automated workflow.   
  
From our dashboard, a user clicks "Start Call." The agent dials the partner, navigates the conversation using our organization's specific guidelines, and streams the transcript live to the screen. The moment the call ends, AutoReach extracts the context, generates a tailored follow-up email, and sends it directly to the partner. Zero human intervention required.  
  
## How we built it  
  
We engineered a fully Dockerized, production-ready stack designed for stateful orchestration, not just simple prompt-and-response.  
  
* **Voice & Orchestration:** We used **Vapi** for ultra-low latency telephony. When the assistant speaks, Vapi calls our backend’s OpenAI-compatible `/chat/completions` endpoint, which is powered by **Railtracks**: we define the “Alex” agent as a Railtracks agent node with a `search_knowledge_base` tool, pre-inject RAG context into the prompt, and invoke the flow to get the next reply. Railtracks gives us structured agent nodes, tool execution, and a clean way to trace and log the conversation.  
* **Knowledge Grounding (RAG):** We use **Railtracks** for the full RAG pipeline: **ChromaDB** (via `ChromaVectorStore`), **FixedTokenChunker**, and **EmbeddingService** from Railtracks. Our playbooks and logistics docs are chunked, embedded, and stored in Chroma; the agent’s `search_knowledge_base` tool and our pre-fetch step both call this store so every response is grounded in our actual organizational data.  
* **Real-Time Data Pipeline:** The **FastAPI** backend captures real-time webhooks from Vapi, pushing events into an AsyncIO queue to stream live transcripts to the **Next.js** frontend via Server-Sent Events (SSE).   
* **Automated Follow-ups:** Post-call, the final transcript is sent to **GPT-4o**, which triggers an automated SMTP follow-up email.  
  
## Challenges we ran into  
  
Building a responsive, real-time interface for active phone calls was a major hurdle. We had to abandon standard API polling and implement an AsyncIO queue paired with Server-Sent Events (SSE) to ensure the frontend received immediate, polling-free transcript updates.   
  
Keeping the AI strictly on-script was another challenge. We had to carefully tune our RAG pipeline to ensure the agent reliably used the `retrieve_context()` tool to pull the exact right playbook from ChromaDB at the right time.  
  
## Accomplishments that we're proud of  
  
We are incredibly proud to have built a system that isn't just a simple LLM wrapper, but a fully orchestrated, stateful voice platform. Deploying the entire infrastructure as a robust, 4-container Docker stack makes it genuinely production-ready.   
  
Most importantly, we achieved true zero-touch automation. Watching the system autonomously dial a number, hold a grounded conversation, and immediately send a customized follow-up email without any human input feels like magic.  
  
## What we learned  
  
Building a functional voice agent requires much more than just a clever prompt; it demands rigid workflow orchestration. Working with Railtracks taught us how to structure and trace agent execution state, while building the real-time pipeline deepened our understanding of handling asynchronous events and webhooks.  
  
## What's next for AutoReach  
  
Our immediate next step is deploying AutoReach directly into Food for the Capital's operations to handle all upcoming food drive outreach. Once validated in the field, we plan to package AutoReach as a scalable blueprint for other grassroots nonprofits, allowing them to eliminate administrative friction and focus their volunteers on what actually matters—helping the community.

## Project Structure

```
AutoReach/
├── .env
├── docker-compose.yml
├── README.md
├── backend/
│   ├── main.py                  ← FastAPI entry point
│   ├── database.py              ← SQLAlchemy models + session
│   ├── routes/
│   │   ├── dashboard.py         ← Frontend-facing API endpoints
│   │   ├── vapi_calls.py        ← POST /calls/start, GET /calls/{id}/stream (SSE)
│   │   └── vapi_webhook.py      ← Vapi webhooks; /chat/completions (Railtracks agent)
│   ├── services/
│   │   ├── langchain_agent.py   ← Railtracks agent (Alex), tool node, flow invocation
│   │   ├── rag_retriever.py     ← Railtracks ChromaDB + chunker + embeddings; RAG retrieval
│   │   └── call_events.py       ← In-memory event queue for SSE transcript relay
│   ├── chroma_db/               ← ChromaDB persistence (created by RAG ingestion)
│   └── rag/
│       └── documents/           ← Source .txt files for RAG (playbooks, scripts, FAQ)
│           ├── call_script.txt
│           ├── foodbank_faq.txt
│           ├── objection_responses.txt
│           └── pickup_logistics.txt
└── frontend/
    └── app/
        ├── page.tsx              ← Landing page
        ├── dashboard/            ← Dashboard with map, Queue Call, call log
        ├── call/                 ← Active call page (orb, live transcript, SSE)
        ├── layout.tsx
        ├── components/
        │   ├── CallLog.tsx       ← Live call log with badges
        │   ├── OttawaMap.tsx     ← Mapbox map of Ottawa stores
        │   ├── Transcriber.tsx   ← Live transcript bubbles (AI / You)
        │   └── StatCards.tsx     ← Summary metric cards
        └── lib/
            └── api.ts            ← Central fetch functions
```

### Railtracks in this project

We used Railtracks for both the voice agent and RAG:

- **Agent (`backend/services/langchain_agent.py`):** The “Alex” coordinator is a `rt.agent_node` with a single tool, `search_knowledge_base`, implemented as a `@rt.function_node`. Each turn, we pre-fetch RAG context with the latest user message, inject it into the prompt, and run `Flow("alex-response", entry_point=AlexAgent).ainvoke(prompt)` to get the next reply. Vapi sends conversation history to our `/chat/completions` handler, which calls this and streams the result back in OpenAI format.
- **RAG (`backend/services/rag_retriever.py`):** We use Railtracks’ `ChromaVectorStore`, `FixedTokenChunker`, and `EmbeddingService` to chunk our `.txt` playbooks, embed them, and store them in ChromaDB. `retrieve_context(query, top_k)` is used both inside the agent tool and in the pre-fetch step before invoking the agent.

Railtracks is listed in `backend/pyproject.toml`; run `uv sync` in the backend to install it.

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

# OpenAI — used by Railtracks for the Alex agent (GPT-4) and for RAG embeddings
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

