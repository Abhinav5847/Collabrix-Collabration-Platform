import boto3
import os
from langgraph_checkpoint_aws import DynamoDBSaver

def get_agent_checkpointer():
    session = boto3.Session(
        region_name=os.getenv("AWS_REGION", "us-east-1"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
    )
    
    endpoint = os.getenv("DYNAMODB_URL")

    # We explicitly define the index shapes here to stop the ValidationException
    return DynamoDBSaver(
        table_name="Collabrix_Agent_Checkpoints",
        session=session,
        endpoint_url=endpoint if endpoint else None,
        key_schema={
            "partition_key": "PK",
            "sort_key": "SK"
        }
    )