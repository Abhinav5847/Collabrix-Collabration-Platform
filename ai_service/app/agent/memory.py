# app/agent/memory.py
import boto3
import os
from langgraph_checkpoint_aws import DynamoDBSaver

def get_agent_checkpointer():
    session = boto3.Session(
        region_name=os.getenv("AWS_REGION", "us-east-1"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "local"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "local")
    )
    
    return DynamoDBSaver(
        table_name="Collabrix_Agent_Checkpoints",
        session=session,
        endpoint_url=os.getenv("DYNAMODB_URL", "http://dynamodb-local:8000")
    )

# REMOVE: agent_checkpointer = get_agent_checkpointer()