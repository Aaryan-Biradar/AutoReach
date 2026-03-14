import logging

import railtracks as rt

from services.rag_retriever import retrieve_context

logger = logging.getLogger(__name__)

ALEX_SYSTEM_PROMPT = """\
You are Alex, an outreach coordinator for Food for the Capital (FFTC), \
a non-profit in Ottawa. You are on a phone call with a grocery store.

Your personality:
- Friendly, driven, and highly respectful
- Sound like a local student organizer, NOT a telemarketer
- Concise — managers are busy, keep responses short and natural
- If interrupted, stop and listen

Use ONLY the knowledge base context provided in the prompt to answer questions \
about FFTC, the booth event, logistics, stats, and objections. Do not make up \
details that are not in the provided context.

Respond with ONLY the next thing you would say on the call — no stage directions, \
no labels, no quotation marks.\
"""


@rt.function_node
def search_knowledge_base(query: str):
    """Search the FFTC knowledge base for relevant context about the organization,
    call scripts, objection handling, and booth event logistics.

    Args:
        query (str): The search query describing what information is needed.
    """
    logger.info("RAG tool called with query: %s", query)
    results = retrieve_context(query, top_k=4)
    logger.info("RAG returned %d chunks", len(results))
    return "\n\n".join(results)


AlexAgent = rt.agent_node(
    name="Alex",
    llm=rt.llm.OpenAILLM("gpt-4"),
    system_message=ALEX_SYSTEM_PROMPT,
    tool_nodes=[search_knowledge_base],
)


async def get_agent_response(conversation: list[dict]) -> str:
    """Take the full conversation history and return Alex's next reply.

    Pre-fetches RAG context using the latest user message, injects it into
    the prompt, then runs through the Railtracks agent.
    """
    lines = []
    for msg in conversation:
        speaker = "Alex" if msg["role"] == "assistant" else "Store Manager"
        lines.append(f"{speaker}: {msg['content']}")
    formatted = "\n".join(lines)

    latest_user_msg = ""
    for msg in reversed(conversation):
        if msg["role"] == "user":
            latest_user_msg = msg["content"]
            break

    logger.info("Pre-fetching RAG context for: %s", latest_user_msg[:100])
    rag_chunks = retrieve_context(latest_user_msg, top_k=4)
    rag_context = "\n\n".join(rag_chunks)

    prompt = (
        f"Relevant knowledge base context:\n{rag_context}\n\n"
        f"Conversation so far:\n{formatted}\n\n"
        "Generate Alex's next response. Be concise and natural."
    )

    flow = rt.Flow("alex-response", entry_point=AlexAgent)
    result = await flow.ainvoke(prompt)
    return result.text
