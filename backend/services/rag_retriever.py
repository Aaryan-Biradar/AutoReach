import logging
import os

from railtracks.vector_stores.chroma import ChromaVectorStore
from railtracks.vector_stores.chunking.base_chunker import Chunk
from railtracks.vector_stores.chunking.fixed_token_chunker import FixedTokenChunker
from railtracks.rag.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)

embedding_function = EmbeddingService().embed

store = ChromaVectorStore(
    collection_name="fftc_docs",
    embedding_function=embedding_function,
    path=os.path.join(os.path.dirname(__file__), "..", "chroma_db"),
)

chunker = FixedTokenChunker(chunk_size=500, overlap=50)


def retrieve_context(query: str, top_k: int = 4) -> list[str]:
    """Search the vector store and return the top-k most relevant text chunks."""
    results = store.search(query, top_k=top_k)
    return [result.content for result in results]


def ingest_documents(directory: str) -> None:
    """Read .txt files from *directory*, chunk them, and upsert into ChromaDB.

    Skips entirely if the store already contains documents.
    """
    if store.count() > 0:
        logger.info(
            "Vector store already populated (%d vectors) — skipping ingestion.",
            store.count(),
        )
        return

    all_chunks: list[Chunk] = []
    for filename in sorted(os.listdir(directory)):
        if not filename.endswith(".txt"):
            continue
        filepath = os.path.join(directory, filename)
        with open(filepath, encoding="utf-8") as f:
            text = f.read().strip()
        if not text:
            continue

        text_chunks = chunker.split_text(text)
        for tc in text_chunks:
            all_chunks.append(
                Chunk(content=tc, document=filename, metadata={"source": filename})
            )
        logger.info("Chunked %s → %d chunks", filename, len(text_chunks))

    if all_chunks:
        store.upsert(all_chunks)
        logger.info("Ingestion complete: %d total chunks", len(all_chunks))
    else:
        logger.warning("No chunks to ingest — check RAG document directory.")
