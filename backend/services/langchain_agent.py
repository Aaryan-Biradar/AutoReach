import json
import logging

import railtracks as rt

from services.rag_retriever import retrieve_context

logger = logging.getLogger(__name__)

ALEX_SYSTEM_PROMPT = """\
You are Alex, an executive and outreach coordinator for Food for the Capital (FFTC), \
a non-profit led by high school students in Ottawa. You are currently on a phone call \
with a grocery store to ask permission to set up a food donation booth outside their store.

Your personality:
- Friendly, driven, and highly respectful
- Sound like a local student organizer, NOT a telemarketer
- Concise — managers are busy, keep responses short and natural
- If interrupted, stop and listen

Your goal on this call:
1. Get past the gatekeeper to speak with the manager
2. Pitch the booth event: 2 volunteers + 1 executive, table + donation boxes, outside the store, weekends 10am-2pm
3. Secure verbal approval OR get an email to send an info package
4. If declined, exit gracefully and leave the door open

Key stats: Over 17,000 lbs of food and $17,000 raised for Ottawa food banks.

Use the search_knowledge_base tool when you need specific details about FFTC, \
objection responses, call scripts, or booth logistics. Respond with ONLY the next \
thing you would say on the call — no stage directions, no labels, no quotation marks.\
"""


@rt.function_node
def search_knowledge_base(query: str):
    """Search the FFTC knowledge base for relevant context about the organization,
    call scripts, objection handling, and booth event logistics.

    Args:
        query (str): The search query describing what information is needed.
    """
    results = retrieve_context(query, top_k=4)
    return "\n\n".join(results)


AlexAgent = rt.agent_node(
    name="Alex",
    llm=rt.llm.OpenAILLM("gpt-4"),
    system_message=ALEX_SYSTEM_PROMPT,
    tool_nodes=[search_knowledge_base],
)


async def get_agent_response(conversation: list[dict]) -> str:
    """Take the full conversation history and return Alex's next reply.

    Formats the Vapi conversation into a prompt, runs it through the
    Railtracks agent (which may search RAG), and returns the text response.
    """
    lines = []
    for msg in conversation:
        speaker = "Alex" if msg["role"] == "assistant" else "Store Manager"
        lines.append(f"{speaker}: {msg['content']}")
    formatted = "\n".join(lines)

    prompt = (
        f"Here is the conversation so far:\n\n{formatted}\n\n"
        "Generate Alex's next response. Be concise and natural."
    )

    flow = rt.Flow("alex-response", entry_point=AlexAgent)
    result = await flow.ainvoke(prompt)
    return result.text
