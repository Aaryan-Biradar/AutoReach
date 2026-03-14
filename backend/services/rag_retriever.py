# RAG retrieval layer — owned by Person 2.
# Handles vector search against pgvector using langchain_postgres.PGVector.
# Also provides a one-time ingestion function to chunk, embed, and store
# the plain-text documents from backend/rag/documents/.


async def retrieve_context(query: str, top_k: int = 4) -> list[str]:
    """Embed the query with text-embedding-3-small and search pgvector.

    Returns the top_k most semantically similar document chunk texts.
    Uses the <-> cosine distance operator via PGVector under the hood.
    """
    raise NotImplementedError


def ingest_documents(directory: str) -> None:
    """Read all .txt files from the given directory, chunk them (~500 tokens
    with overlap), embed each chunk with text-embedding-3-small, and upsert
    into the document_chunks table in pgvector.

    This only needs to run once (or whenever the documents change).
    Call it manually or from a startup script.
    """
    raise NotImplementedError
