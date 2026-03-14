# AutoReach

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

The project needs API keys and database credentials to run. Create a `.env` file at the **root** of the project (next to `docker-compose.yml`):

```bash
touch .env
```

Then open it and add the following. Ask a teammate for the actual values if you don't have them yet:

```env
# Database — this connects your backend to the PostgreSQL container
DATABASE_URL=postgresql://postgres:password@db:5432/autoreach
 
# Vapi — the voice calling service
VAPI_API_KEY=your_vapi_key_here
 
# OpenAI — used for embeddings and LangChain
OPENAI_API_KEY=your_openai_key_here
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

If you want to run the entire stack — database, backend, and frontend — all together with a single command, you can use Docker Compose. Make sure Docker Desktop is running, then from the project root:

```bash
docker compose up
```

This builds and starts all three services. The first time you run this it may take a minute or two to build the images. After that it's much faster.

To stop everything, press `Ctrl+C` or run:

```bash
docker compose down
```

