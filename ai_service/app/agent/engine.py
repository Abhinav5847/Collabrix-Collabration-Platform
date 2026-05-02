import os
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langchain_groq import ChatGroq
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.runnables import RunnableConfig
from langchain_core.messages import SystemMessage # Added for strict instructions

from .state import AgentState
from .tools import GLOBAL_TOOLS

def create_agent_executor():
    llm = ChatGroq(
        model="llama-3.1-8b-instant", 
        temperature=0,
        groq_api_key=os.getenv("GROQ_API_KEY")
    )
    
    llm_with_tools = llm.bind_tools(GLOBAL_TOOLS)

    async def call_model(state: AgentState, config: RunnableConfig):
        # Explicitly tell the LLM it ONLY has create_workspace
        system_instructions = SystemMessage(
            content=(
                "You are the Collabrix Global Agent. "
                "You have access to the 'create_workspace' tool. "
                "DO NOT attempt to use 'brave_search', web search, or any other tools. "
                "If you successfully create a workspace, stop and inform the user. "
                "If an action fails, explain why and do not retry more than once."
            )
        )
        
        
        messages = [system_instructions] + state["messages"]
        
        response = await llm_with_tools.ainvoke(messages, config=config)
        return {"messages": [response]}

    # 3. Routing Logic
    def should_continue(state: AgentState):
        messages = state.get("messages", [])
        if not messages: return "end"
        last_message = messages[-1]
        
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "tools"
        return "end"

    workflow = StateGraph(AgentState)
    workflow.add_node("agent", call_model)
    workflow.add_node("tools", ToolNode(GLOBAL_TOOLS))

    workflow.add_edge(START, "agent")
    workflow.add_conditional_edges(
        "agent", 
        should_continue,
        {"tools": "tools", "end": END}
    )
    workflow.add_edge("tools", "agent")

    checkpointer = MemorySaver()
    return workflow.compile(checkpointer=checkpointer)

collabrix_agent = create_agent_executor()