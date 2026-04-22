from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from app.ai.llm import llm
from app.vector.qdrant import search
from app.services.memory import get_history
from fastapi.concurrency import run_in_threadpool

# 1. Define the State
class AgentState(TypedDict):
    message: str
    workspace_id: str
    doc_id: str
    history: List[dict]
    context: str
    response: str

# 2. Define the RAG Node
async def retrieve_and_generate(state: AgentState):
    """
    Node that searches Qdrant and generates a response from the LLM.
    """
    # Retrieve context from Qdrant
    context_hits = await run_in_threadpool(
        search, 
        state["message"], 
        state["workspace_id"],
        state["doc_id"] 
    )
    
    context_text = "\n\n".join(context_hits) if context_hits else "No relevant context found."

    # Format History for the Prompt
    formatted_history = ""
    for entry in state.get('history', []):
        role = "Assistant" if entry.get("role") == "ai" else "User"
        content = entry.get("content", "")
        formatted_history += f"{role}: {content}\n"

    # Build Prompt with Context AND History
    prompt = f"""
    You are a workspace assistant for Collabrix. 
    Use the history to remember the user's name or previous context.
    Answer based on the context and conversation history provided.
    
    CONVERSATION HISTORY:
    {formatted_history}
    
    DOCUMENT CONTEXT:
    {context_text}
    
    USER QUESTION:
    {state['message']}
    """

    # Invoke LLM (Grok/Gemini)
    response = await llm.ainvoke(prompt)
    
    return {"response": response.content, "context": context_text}

# 3. Build/Compile the Graph
workflow = StateGraph(AgentState)
workflow.add_node("agent", retrieve_and_generate)
workflow.set_entry_point("agent")
workflow.add_edge("agent", END)
app_rag = workflow.compile()

# --- 4. FIXED Helper Function ---
async def run_rag(state_input: dict):
    """
    Entry point that fetches history from DynamoDB before running the graph.
    """
    doc_id = state_input.get("doc_id")
    
    # 1. Fetch history from DynamoDB
    saved_history = get_history(doc_id)
    
    # 2. Inject it into the state so the 'agent' node can see it
    state_input["history"] = saved_history

    # 3. Execute the graph
    result = await app_rag.ainvoke(state_input)
    return result["response"]