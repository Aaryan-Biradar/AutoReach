# LangChain reasoning layer — owned by Person 2.
# Receives the full conversation history from the Vapi webhook, optionally
# queries RAG for relevant context, calls GPT-4, and returns the next
# response the voice agent should speak.


async def get_agent_response(conversation: list[dict]) -> str:
    """Take the full conversation history and return the agent's next reply.

    Steps:
    1. Extract the latest user message from conversation.
    2. Call retrieve_context() from rag_retriever to get relevant document chunks.
    3. Build a prompt with _build_prompt() combining conversation + RAG context.
    4. Send the prompt to GPT-4 via LangChain and return the response text.
    """
    raise NotImplementedError


def _build_prompt(conversation: list[dict], context: str) -> str:
    """Assemble the system prompt injecting RAG context and conversation history.

    The prompt should instruct GPT-4 to act as a friendly, professional food
    bank outreach coordinator calling on behalf of Food for the Capital.
    The context parameter contains the top retrieved document chunks joined
    together as a single string.
    """
    raise NotImplementedError
