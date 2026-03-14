import logging
import os
from contextlib import asynccontextmanager

logging.basicConfig(
    level=logging.INFO,
    format="%(name)s | %(levelname)s | %(message)s",
)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_tables
from routes.dashboard import router as dashboard_router
from routes.vapi_webhook import router as vapi_router
from routes.vapi_calls import router as vapi_calls_router
from services.rag_retriever import ingest_documents

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    rag_dir = os.path.join(os.path.dirname(__file__), "rag", "documents")
    print(f"[RAG] Starting ingestion from {rag_dir}", flush=True)
    try:
        ingest_documents(rag_dir)
    except Exception as e:
        print(f"[RAG] Ingestion FAILED: {e}", flush=True)
        logger.exception("RAG ingestion failed — server will start without RAG")
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router, prefix="/api")
app.include_router(vapi_calls_router, prefix="/api")
app.include_router(vapi_router)


@app.get("/")
async def root():
    return {"message": "AutoReach backend is running"}
