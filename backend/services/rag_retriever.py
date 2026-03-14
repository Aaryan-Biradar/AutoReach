import logging
import os

import openai
from railtracks.rag import TextChunkingService
from railtracks.vector_stores import ChromaVectorStore

logger = logging.getLogger(__name__)

_client: openai.OpenAI | None = None
_store: ChromaVectorStore | None = None


def _get_client() -> openai.OpenAI:
    global _client
    if _client is None:
        _client = openai.OpenAI()
    return _client


def _get_store() -> ChromaVectorStore:
    global _store
    if _store is None:
        _store = ChromaVectorStore(
            collection_name="fftc_docs",
            embedding_function=_embed_texts,
            path=os.path.join(os.path.dirname(__file__), "..", "chroma_db"),
        )
    return _store


def _embed_texts(texts: list[str]) -> list[list[float]]:
    response = _get_client().embeddings.create(model="text-embedding-3-small", input=texts)
    return [item.embedding for item in response.data]


def retrieve_context(query: str, top_k: int = 4) -> list[str]:
    """Search the vector store and return the top-k most relevant text chunks."""
    store = _get_store()
    results = store.search(query, top_k=top_k)
    chunks = [result.content for result in results]
    logger.info("retrieve_context(%r) -> %d chunks, first 80 chars each: %s",
                query, len(chunks), [c[:80] for c in chunks])
    return chunks


def ingest_documents(directory: str) -> None:
    """Read .txt files from *directory*, chunk them, and upsert into ChromaDB.

    Skips entirely if the store already contains documents.
    """
    store = _get_store()

    count = store.count()
    if count > 0:
        logger.info("Vector store already populated (%d vectors) — skipping ingestion.", count)
        print(f"[RAG] Vector store already populated ({count} vectors) — skipping ingestion.", flush=True)
        return

    chunker = TextChunkingService(
        chunk_size=500,
        chunk_overlap=50,
        strategy=TextChunkingService.chunk_by_token,
    )

    total_chunks = 0
    for filename in sorted(os.listdir(directory)):
        if not filename.endswith(".txt"):
            continue
        filepath = os.path.join(directory, filename)
        with open(filepath, encoding="utf-8") as f:
            text = f.read().strip()
        if not text:
            continue

        chunks = chunker.chunk(text)
        store.upsert(chunks)
        total_chunks += len(chunks)
        logger.info("Ingested %s → %d chunks", filename, len(chunks))

    logger.info("Ingestion complete: %d total chunks from %s", total_chunks, directory)
    print(f"[RAG] Ingestion complete: {total_chunks} total chunks from {directory}", flush=True)
