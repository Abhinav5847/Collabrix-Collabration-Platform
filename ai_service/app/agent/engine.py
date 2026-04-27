import os
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langchain_groq import ChatGroq

from .state import AgentState
from .tools import GLOBAL_TOOLS
from .memory import get_agent_checkpointer 

def create_agent_executor():
    # 1. Initialize LLM (Ensure the model version is correct)
    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0,
        groq_api_key=os.getenv("GROQ_API_KEY")
    )
    
    # CRITICAL: We bind the tools here so the model knows they exist
    llm_with_tools = llm.bind_tools(GLOBAL_TOOLS)

    # 2. Routing Logic
    def should_continue(state: AgentState):
        messages = state.get("messages", [])
        if not messages: 
            return "end"
        
        last_message = messages[-1]
        
        # Check if the LLM generated a tool_call
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "tools"
        
        return "end"

    # 3. Model Node
    async def call_model(state: AgentState):
        # We invoke the LLM that has been 'bound' to the tools
        response = await llm_with_tools.ainvoke(state["messages"])
        return {"messages": [response]}

    # 4. Graph Construction
    workflow = StateGraph(AgentState)

    workflow.add_node("agent", call_model)
    # The ToolNode MUST receive the exact same list as bind_tools
    workflow.add_node("tools", ToolNode(GLOBAL_TOOLS))

    workflow.add_edge(START, "agent")
    
    workflow.add_conditional_edges(
        "agent", 
        should_continue,
        {
            "tools": "tools",
            "end": END
        }
    )

    # After tools run, we go back to the agent to summarize the result
    workflow.add_edge("tools", "agent")

    # 5. Compilation with Persistence
    try:
        checkpointer = get_agent_checkpointer()
        # Ensure your memory.py doesn't pass unexpected arguments like 'key_schema'
        return workflow.compile(checkpointer=checkpointer)
    except Exception as e:
        print(f"⚠️ Persistence Layer Error: {e}")
        return workflow.compile() 

# Instantiate for use in agent_chat.py
agent_executor = create_agent_executor()