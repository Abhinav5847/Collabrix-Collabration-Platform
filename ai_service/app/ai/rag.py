from typing import TypedDict
from langgraph.graph import StateGraph, END
from app.ai.llm import llm
from app.vector.qdrant import get_retriever
from app.services.memory import get_history, save_message

# Define what data moves through the AI "brain"
class AgentState(TypedDict):
    message: str
    workspace_id: str
    doc_id: str
    history: str # Formatted string for the LLM
    context: str # Retreived text from Qdrant
    response: str

async def prepare_node(state: AgentState):
    """
    Step 1: Get data from DynamoDB (History) and Qdrant (Context)
    """
    # 1. Fetch from DynamoDB
    # We use str() to ensure it matches the Partition Key type in Dynamo
    raw_history = get_history(str(state["doc_id"])) 
    formatted_history = "\n".join([f"{h['role']}: {h['content']}" for h in raw_history])

    # 2. Fetch from Qdrant
    retriever = get_retriever(state["workspace_id"], state["doc_id"])
    # await is crucial here because retriever calls are I/O bound
    docs = await retriever.ainvoke(state["message"])
    
    context_text = "\n\n".join([d.page_content for d in docs]) if docs else "NO_CONTEXT"
    
    return {"history": formatted_history, "context": context_text}

async def generate_node(state: AgentState):
    """
    Step 2: Send everything to Llama-3 via Groq
    """
    if state['context'] == "NO_CONTEXT":
        return {"response": "I couldn't find any information in this document to answer that."}

    prompt = f"""You are the Collabrix AI Assistant. 
Answer the user based ONLY on the following document context and chat history.

DOCUMENT CONTEXT:
{state['context']}

CHAT HISTORY:
{state['history']}

USER QUESTION: 
{state['message']}

Assistant:"""

    res = await llm.ainvoke(prompt)
    return {"response": res.content}

def save_node(state: AgentState):
    """
    Step 3: Save the exchange back to DynamoDB
    """
    # Save user's question and AI's answer
    save_message(str(state["doc_id"]), "user", state["message"])
    save_message(str(state["doc_id"]), "ai", state["response"])
    return state

# --- Build the Graph ---
workflow = StateGraph(AgentState)
workflow.add_node("prepare", prepare_node)
workflow.add_node("generate", generate_node)
workflow.add_node("save", save_node)

workflow.set_entry_point("prepare")
workflow.add_edge("prepare", "generate")
workflow.add_edge("generate", "save")
workflow.add_edge("save", END)

app_rag = workflow.compile()

async def run_rag(state_input: dict):
    # This triggers the full 3-step process
    result = await app_rag.ainvoke(state_input)
    return result["response"]