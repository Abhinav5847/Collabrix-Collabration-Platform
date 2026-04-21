from app.ai.llm import llm
from app.vector.qdrant import search
from fastapi.concurrency import run_in_threadpool

async def run_rag(state):
    """
    RAG Pipeline:
    1. Retrieve context specifically for the given doc_id.
    2. Format history and context into a prompt.
    3. Generate a response using Grok-4.
    """

    # 1. Get context from Qdrant 
    # We pass doc_id now to ensure the AI only talks about THIS specific document.
    context = await run_in_threadpool(
        search, 
        state["message"], 
        state["workspace_id"],
        state["doc_id"] 
    )

    context_text = "\n\n".join(context) if context else "No relevant context found."

    # 2. Format Chat History into a readable string for the LLM
    formatted_history = ""
    for entry in state.get('history', []):
        role = entry.get("role", "user").capitalize()
        content = entry.get("content", "")
        formatted_history += f"{role}: {content}\n"

    # 3. Build the Grok-specific Prompt
    prompt = f"""
You are a workspace assistant powered by Grok. Your goal is to answer questions about a specific document.

CONTEXT FROM THE DOCUMENT:
{context_text}

RECENT CHAT HISTORY:
{formatted_history}

USER REQUEST:
{state['message']}

INSTRUCTIONS:
- Answer accurately based ONLY on the provided context.
- If the answer isn't in the context, politely inform the user you don't have that information.
- Keep your tone professional and helpful.
"""

    # 4. Call Grok (using the ASYNC 'ainvoke' method)
    # This prevents the FastAPI server from hanging during the request.
    response = await llm.ainvoke(prompt)

    return response.content