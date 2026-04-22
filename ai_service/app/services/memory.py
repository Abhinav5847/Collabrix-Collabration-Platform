import boto3
import os
import time
from boto3.dynamodb.conditions import Key

# 1. Grab the URL from the docker-compose environment variables
# If it's missing (Cloud mode), it defaults to None
endpoint_url = os.getenv("DYNAMODB_URL")

dynamodb = boto3.resource(
    'dynamodb', 
    region_name=os.getenv("AWS_REGION", "us-east-1"),
    endpoint_url=endpoint_url,  # CRITICAL: This connects to your container
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "local"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "local")
)

table = dynamodb.Table('Collabrix_AiChat_History')

def get_history(doc_id: str, limit: int = 10):
    """Fetches the last 10 messages for this document from DynamoDB"""
    try:
        response = table.query(
            KeyConditionExpression=Key('doc_id').eq(doc_id),
            ScanIndexForward=False, # Newest messages first
            Limit=limit
        )
        return sorted(response.get('Items', []), key=lambda x: x['timestamp'])
    except Exception as e:
        print(f"DynamoDB Read Error: {e}")
        return []

def save_message(doc_id: str, role: str, content: str):
    """Saves a single message to DynamoDB"""
    try:
        table.put_item(
            Item={
                'doc_id': str(doc_id),
                'timestamp': int(time.time() * 1000),
                'role': role,
                'content': content
            }
        )
    except Exception as e:
        print(f"DynamoDB Write Error: {e}")