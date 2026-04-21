from typing import TypedDict, List, Annotated
from langgraph.graph import StateGraph, END
from app.ai.llm import llm
from app.vector.qdrant import search
from fastapi.concurrency import run_in_threadpool

# 1. Define the State (The data that flows through the graph)
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
    Node that searches Qdrant and generates a response from Grok.
    """
    # Retrieve context from Qdrant
    context_hits = await run_in_threadpool(
        search, 
        state["message"], 
        state["workspace_id"],
        state["doc_id"] 
    )
    
    context_text = "\n\n".join(context_hits) if context_hits else "No relevant context found."

    # Format History
    formatted_history = ""
    for entry in state.get('history', []):
        role = entry.get("role", "user").capitalize()
        content = entry.get("content", "")
        formatted_history += f"{role}: {content}\n"

    # Build Prompt
    prompt = f"""
    You are a workspace assistant. Answer based ONLY on the context.
    
    CONTEXT:
    {context_text}
    
    HISTORY:
    {formatted_history}
    
    QUESTION:
    {state['message']}
    """

    # Invoke LLM
    response = await llm.ainvoke(prompt)
    
    # Return the updated state
    return {"response": response.content, "context": context_text}

# 3. Build the Graph
workflow = StateGraph(AgentState)

# Add our single node
workflow.add_node("agent", retrieve_and_generate)

# Define the flow
workflow.set_entry_point("agent")
workflow.add_edge("agent", END)

# 4. Compile the Graph
app_rag = workflow.compile()

# --- The Helper Function for your FastAPI Router ---
async def run_rag(state_input: dict):
    """
    Entry point for the FastAPI router to interact with the graph.
    """
    # Execute the graph
    result = await app_rag.ainvoke(state_input)
    return result["response"]