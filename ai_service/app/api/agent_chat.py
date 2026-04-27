from fastapi import APIRouter, HTTPException
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
        # thread_id MUST be a string to match the AWS Partition Key
        config = {
            "configurable": {
                "thread_id": str(data.thread_id)
            }
        }
        
        input_state = {
            "messages": [HumanMessage(content=data.message)],
            "user_id": data.user_id 
        }
        
        # Invoke the Agent
        result = await agent_executor.ainvoke(input_state, config=config)
        
        if "messages" in result and len(result["messages"]) > 0:
            return {"response": result["messages"][-1].content}
        
        return {"response": "No response from agent."}

    except Exception as e:
        print(f"❌ AGENT API ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))