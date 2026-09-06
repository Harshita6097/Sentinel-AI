"""ChromaDB vector store for incident memory.

Provides persistent storage and semantic retrieval of incidents.
Falls back to in-memory operation when chromadb is not installed.

Collection: "incidents"
  - Documents: normalized_text of each incident
  - Metadata:  id, location, incident_type, severity_label, status, time
  - Embeddings: sentence-transformers/all-MiniLM-L6-v2 (via ChromaDB default)

Usage:
  from services.chroma_store import chroma_store
  chroma_store.upsert(incident)
  results = chroma_store.semantic_search("hospital flooding", n=5)
"""
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

_CHROMA_DIR = Path(os.getenv("CHROMA_PERSIST_DIR", "../chroma")).resolve()
_COLLECTION_NAME = "incidents"

_client = None
_collection = None


def _get_collection():
    """Lazy-initialize ChromaDB client and collection."""
    global _client, _collection
    if _collection is not None:
        return _collection
    try:
        import chromadb
        from chromadb.config import Settings

        _CHROMA_DIR.mkdir(parents=True, exist_ok=True)
        _client = chromadb.PersistentClient(
            path=str(_CHROMA_DIR),
            settings=Settings(anonymized_telemetry=False),
        )
        _collection = _client.get_or_create_collection(
            name=_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info("ChromaDB collection '%s' ready at %s", _COLLECTION_NAME, _CHROMA_DIR)
        return _collection
    except Exception as exc:
        logger.warning("ChromaDB unavailable (%s) — incident memory is in-memory only", exc)
        return None


class ChromaIncidentStore:
    """Thin wrapper around a ChromaDB collection for incident persistence."""

    def upsert(self, incident) -> None:
        """Add or update an incident in the vector store."""
        col = _get_collection()
        if col is None:
            return
        try:
            col.upsert(
                ids=[incident.id],
                documents=[incident.normalized_text or incident.raw_text],
                metadatas=[{
                    "id":             incident.id,
                    "location":       incident.location or "",
                    "incident_type":  incident.incident_type,
                    "severity_label": incident.severity_label,
                    "severity_score": incident.severity_score,
                    "status":         incident.status,
                    "time":           incident.time,
                    "source":         incident.source,
                }],
            )
        except Exception as exc:
            logger.debug("ChromaDB upsert failed for %s: %s", incident.id, exc)

    def semantic_search(self, query: str, n: int = 5, where: dict | None = None) -> list[dict]:
        """Search incidents by semantic similarity to query text.

        Args:
            query: Natural language search query.
            n:     Maximum number of results.
            where: Optional ChromaDB metadata filter dict.

        Returns:
            List of metadata dicts for matching incidents, ordered by similarity.
        """
        col = _get_collection()
        if col is None:
            return []
        try:
            kwargs: dict = {"query_texts": [query], "n_results": min(n, max(col.count(), 1))}
            if where:
                kwargs["where"] = where
            results = col.query(**kwargs)
            metadatas = results.get("metadatas", [[]])[0]
            return metadatas
        except Exception as exc:
            logger.debug("ChromaDB search failed: %s", exc)
            return []

    def delete(self, incident_id: str) -> None:
        """Remove an incident from the vector store."""
        col = _get_collection()
        if col is None:
            return
        try:
            col.delete(ids=[incident_id])
        except Exception as exc:
            logger.debug("ChromaDB delete failed for %s: %s", incident_id, exc)

    def count(self) -> int:
        """Return number of stored incidents."""
        col = _get_collection()
        if col is None:
            return 0
        try:
            return col.count()
        except Exception:
            return 0

    def clear(self) -> None:
        """Delete and recreate the collection (used on simulation reset)."""
        global _collection
        col = _get_collection()
        if col is None:
            return
        try:
            _client.delete_collection(_COLLECTION_NAME)
            _collection = None
            _get_collection()   # recreate
        except Exception as exc:
            logger.debug("ChromaDB clear failed: %s", exc)

    def is_available(self) -> bool:
        return _get_collection() is not None


# Module-level singleton
chroma_store = ChromaIncidentStore()
