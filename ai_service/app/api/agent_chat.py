from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from app.agent.engine import agent_executor
from langchain_core.messages import HumanMessage

router = APIRouter()

class AgentRequest(BaseModel):
    message: str
    thread_id: str 
    user_id: int   

@router.post("")
async def agent_communication(data: AgentRequest):
    try:
        # LangGraph Persistence requires thread_id to be a string
        config = {"configurable": {"thread_id": str(data.thread_id)}}
        
        # StateGraph requires Message Objects for persistence serialization
        input_state = {
            "messages": [HumanMessage(content=data.message)],
            "user_id": data.user_id 
        }
        
        # Invoke the compiled graph
        result = await agent_executor.ainvoke(input_state, config=config)
        
        # Return the content of the last message in the sequence
        return {"response": result["messages"][-1].content}

    except Exception as e:
        print(f"❌ AGENT API ERROR: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Agent Execution Failed: {str(e)}"
        )