from typing import TypedDict
from langgraph.graph import StateGraph, END
from app.ai.llm import llm
from app.vector.qdrant import get_retriever
from app.services.memory import get_history

# Define what data moves through the AI "brain"
class AgentState(TypedDict):
    message: str
    workspace_id: str
    doc_id: str
    session_id: str # The unique User + Doc ID
    history: str    # Formatted string for the LLM
    context: str    # Retrieved text from Qdrant
    response: str

async def prepare_node(state: AgentState):
    """
    Step 1: Fetch history using the UNIQUE session_id.
    This ensures User A never sees User B's messages.
    """
    # Use the session_id (e.g., "abhinav_20") passed from chat.py
    raw_history = get_history(state["session_id"]) 
    formatted_history = "\n".join([f"{h['role']}: {h['content']}" for h in raw_history])

    # Qdrant context remains shared for the document
    retriever = get_retriever(state["workspace_id"], state["doc_id"])
    docs = await retriever.ainvoke(state["message"])
    
    context_text = "\n\n".join([d.page_content for d in docs]) if docs else "NO_CONTEXT"
    
    return {"history": formatted_history, "context": context_text}

async def generate_node(state: AgentState):
    """
    Step 2: Generate response using the isolated history.
    """
    if state['context'] == "NO_CONTEXT" and not state['history']:
        return {"response": "Hello! I'm your Collabrix Assistant. How can I help you today?"}

    prompt = f"""You are the Collabrix AI Assistant. 
Use the provided DOCUMENT CONTEXT for facts, and use the CHAT HISTORY to remember the user.

GUIDELINES:
1. Be natural and conversational. 
2. DO NOT explain where you found the information. Just answer.
3. Use CHAT HISTORY for personal details like the user's name.

DOCUMENT CONTEXT:
{state['context']}

CHAT HISTORY:
{state['history']}

USER QUESTION: 
{state['message']}

Assistant:"""

    res = await llm.ainvoke(prompt)
    return {"response": res.content}

# --- Build the Graph ---
# We REMOVE save_node because chat.py handles saving.
# This prevents the "confused identity" bug.
workflow = StateGraph(AgentState)
workflow.add_node("prepare", prepare_node)
workflow.add_node("generate", generate_node)

workflow.set_entry_point("prepare")
workflow.add_edge("prepare", "generate")
workflow.add_edge("generate", END) # Go straight to END

app_rag = workflow.compile()

async def run_rag(state_input: dict):
    # This triggers the 2-step process (Prepare -> Generate)
    result = await app_rag.ainvoke(state_input)
    return result["response"]