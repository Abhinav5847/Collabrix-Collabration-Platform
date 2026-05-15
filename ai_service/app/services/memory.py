import boto3
import os
import time
from boto3.dynamodb.conditions import Key

# Configuration from environment variables
endpoint_url = os.getenv("DYNAMODB_URL")

dynamodb = boto3.resource(
    'dynamodb', 
    region_name=os.getenv("AWS_REGION", "ap-south-1"),
    endpoint_url=endpoint_url, 
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "local"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "local")
)

table = dynamodb.Table('Collabrix_AiChat_History')  

def get_history(session_id: str, limit: int = 10):
    """
    Retrieves the last N messages for a specific USER + DOCUMENT session.
    """
    try:
        # We query the 'doc_id' Partition Key using the combined session_id string
        response = table.query(
            KeyConditionExpression=Key('doc_id').eq(session_id),
            ScanIndexForward=False, # Get latest first
            Limit=limit
        )
        # Sort items by timestamp so they appear in order in the chat UI
        return sorted(response.get('Items', []), key=lambda x: x['timestamp'])
    except Exception as e:
        print(f"DynamoDB Read Error: {e}")
        return []

def save_message(session_id: str, role: str, content: str):
    """
    Saves a message to the specific bucket for this user and document.
    """
    try:
        table.put_item(
            Item={
                # session_id here will be "user_id_doc_id"
                'doc_id': str(session_id),
                'timestamp': int(time.time() * 1000),
                'role': role,
                'content': content
            }
        )
    except Exception as e:
        print(f"DynamoDB Write Error: {e}")