from typing import Annotated, Sequence, TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    # History of the conversation
    messages: Annotated[Sequence[BaseMessage], add_messages]
    # Context from your Django Backend
    user_id: int
    current_workspace_id: str | None