from typing import TypedDict
from langgraph.graph import StateGraph, END
from app.ai.llm import llm
from app.vector.qdrant import get_retriever
from app.services.memory import get_history, save_message

class AgentState(TypedDict):
    message: str
    workspace_id: str
    doc_id: str
    history: str
    context: str
    response: str

def prepare_node(state: AgentState):

    raw_history = get_history(str(state["doc_id"])) 
    formatted_history = "\n".join([f"{h['role']}: {h['content']}" for h in raw_history[-5:]])

    retriever = get_retriever(state["workspace_id"], state["doc_id"])
    docs = retriever.invoke(state["message"])
    
    print(f"DEBUG: Found {len(docs)} chunks for Doc {state['doc_id']}")
    
    context_text = "\n\n".join([d.page_content for d in docs]) if docs else "NO_CONTEXT"

    return {"history": formatted_history, "context": context_text}

async def generate_node(state: AgentState):

    if state['context'] == "NO_CONTEXT":
        return {"response": "I'm sorry, I don't see any information in the document to answer that."}

    prompt = f"""
    You are the Collabrix AI Assistant. 
    Use the DOCUMENT CONTEXT below to answer the user's question. 
    If the answer isn't in the context, say you don't know.

    DOCUMENT CONTEXT:
    {state['context']}

    CHAT HISTORY:
    {state['history']}

    USER QUESTION: 
    {state['message']}
    """
    res = await llm.ainvoke(prompt)
    return {"response": res.content}

def save_node(state: AgentState):

    save_message(state["doc_id"], "user", state["message"])
    save_message(state["doc_id"], "ai", state["response"])
    return state

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

    result = await app_rag.ainvoke(state_input)
    return result["response"]