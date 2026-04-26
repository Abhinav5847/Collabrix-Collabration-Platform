from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langchain_groq import ChatGroq
import os

from .state import AgentState
from .tools import GLOBAL_TOOLS
from .memory import get_agent_checkpointer 

def create_agent_executor():
    # 1. Initialize LLM
    llm = ChatGroq(
        model_name="llama3-70b-8192",
        temperature=0.1
    )
    llm_with_tools = llm.bind_tools(GLOBAL_TOOLS)

    # 2. Routing Logic
    def should_continue(state: AgentState):
        messages = state.get("messages", [])
        if not messages: return END
        last_message = messages[-1]
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "tools"
        return END

    # 3. Model Node
    async def call_model(state: AgentState):
        response = await llm_with_tools.ainvoke(state["messages"])
        return {"messages": [response]}

    # 4. Graph Construction
    workflow = StateGraph(AgentState)
    workflow.add_node("agent", call_model)
    workflow.add_node("tools", ToolNode(GLOBAL_TOOLS))

    workflow.add_edge(START, "agent")
    workflow.add_conditional_edges("agent", should_continue)
    workflow.add_edge("tools", "agent")

    # 5. Persistent Compilation
    try:
        checkpointer = get_agent_checkpointer()
        return workflow.compile(checkpointer=checkpointer)
    except Exception as e:
        print(f"⚠️ Persistence Layer Warning: {e}")
        return workflow.compile() # Fallback to memory-only if DB is down

agent_executor = create_agent_executor()