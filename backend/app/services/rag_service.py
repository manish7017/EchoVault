import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.conversation import ConversationSession, ConversationMessage
from app.models.memory import Memory
from app.schemas.rag import SourceCitation, ChatMessageResponse, ConversationSessionResponse
from app.services.ai_adapter import llm_adapter, embedding_adapter
from app.services.vector_store import vector_store

logger = logging.getLogger(__name__)

ARCHIVE_ASSISTANT_SYSTEM_PROMPT = """You are the Guardian of EchoVault, an atmospheric archival intelligence presiding over a digital repository of personal memories, photographs, voice recordings, and documents.

Your duties:
1. Provide accurate, thoughtful answers based EXCLUSIVELY on the provided Memory Excerpts.
2. Maintain a respectful, mysterious yet grounded archival tone (like an abandoned library scholar or quiet archivist).
3. Ground every statement in specific facts from the excerpts. Cite memories by their titles in brackets, e.g. "[Memory: The Old Lighthouse Recording]".
4. ABSOLUTE RULE: Never invent historical facts, people, or events. If the archived records do not contain enough information to answer the question, state plainly and elegantly:
   "The archive does not contain records concerning [subject]. The shadows here hold no trace of that recollection."
5. Never pretend to have access to external real-time data or the cloud. All knowledge comes solely from the user's local archive.
"""

class RAGService:
    """Retrieval-Augmented Generation service for conversational archive queries."""

    async def answer_query(
        self,
        db: Session,
        message: str,
        session_id: Optional[str] = None,
        collection_id: Optional[str] = None
    ) -> Dict[str, Any]:
        # 1. Retrieve or create session
        if session_id:
            session = db.query(ConversationSession).filter(ConversationSession.id == session_id).first()
            if not session:
                session = ConversationSession(title=message[:40] + ("..." if len(message) > 40 else ""))
                db.add(session)
                db.flush()
        else:
            session = ConversationSession(title=message[:40] + ("..." if len(message) > 40 else ""))
            db.add(session)
            db.flush()

        # 2. Embed user query
        query_embedding = await embedding_adapter.embed_text(message)

        # 3. Retrieve top-k memory chunks from local vector store
        matched_chunks = vector_store.search_similar_chunks(
            db=db,
            query_embedding=query_embedding,
            top_k=3,
            collection_id=collection_id,
            min_similarity=0.15
        )

        # Build context and source citations
        citations: List[SourceCitation] = []
        context_blocks: List[str] = []

        seen_memories = set()
        for chunk in matched_chunks:
            mem_id = chunk["memory_id"]
            short_chunk = chunk["chunk_text"][:350]
            if mem_id not in seen_memories:
                seen_memories.add(mem_id)
                citations.append(SourceCitation(
                    memory_id=mem_id,
                    title=chunk["title"],
                    memory_type=chunk["memory_type"],
                    recorded_date=chunk.get("recorded_date"),
                    similarity_score=chunk["similarity_score"],
                    snippet=short_chunk[:180] + ("..." if len(short_chunk) > 180 else "")
                ))
            context_blocks.append(
                f"[Document Source: \"{chunk['title']}\" (Type: {chunk['memory_type']}, Date: {chunk.get('recorded_date', 'Unknown')})]\n{short_chunk}"
            )

        context_text = "\n\n---\n\n".join(context_blocks) if context_blocks else "No relevant memory records found in archive."

        # 4. Fetch recent conversation history
        history_msgs = (
            db.query(ConversationMessage)
            .filter(ConversationMessage.session_id == session.id)
            .order_by(ConversationMessage.created_at.asc())
            .limit(4)
            .all()
        )

        chat_messages = []
        chat_messages.append({"role": "system", "content": ARCHIVE_ASSISTANT_SYSTEM_PROMPT})
        for h in history_msgs:
            chat_messages.append({"role": h.role, "content": h.content})

        user_prompt_with_context = (
            f"ARCHIVE EXCERPTS:\n{context_text}\n\n"
            f"USER INQUIRY: {message}\n\n"
            f"Provide an archival response based strictly on the excerpts above. Cite titles in brackets."
        )
        chat_messages.append({"role": "user", "content": user_prompt_with_context})

        # 5. Query local LLM
        answer = await llm_adapter.chat(chat_messages, temperature=0.3, max_tokens=300)

        # 6. Save user and assistant messages
        user_msg = ConversationMessage(
            session_id=session.id,
            role="user",
            content=message
        )
        assistant_msg = ConversationMessage(
            session_id=session.id,
            role="assistant",
            content=answer,
            sources=[c.model_dump() for c in citations]
        )
        db.add(user_msg)
        db.add(assistant_msg)
        db.commit()

        return {
            "session_id": session.id,
            "message": ChatMessageResponse(
                id=assistant_msg.id,
                role="assistant",
                content=answer,
                sources=citations,
                created_at=assistant_msg.created_at
            )
        }

rag_service = RAGService()
