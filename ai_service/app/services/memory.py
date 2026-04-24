import boto3
import os
import time
from boto3.dynamodb.conditions import Key

endpoint_url = os.getenv("DYNAMODB_URL")

dynamodb = boto3.resource(
    'dynamodb', 
    region_name=os.getenv("AWS_REGION", "us-east-1"),
    endpoint_url=endpoint_url, 
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "local"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "local")
)

table = dynamodb.Table('Collabrix_AiChat_History')

def get_history(doc_id: str, limit: int = 10):
    try:
        response = table.query(
            KeyConditionExpression=Key('doc_id').eq(doc_id),
            ScanIndexForward=False, 
            Limit=limit
        )
        return sorted(response.get('Items', []), key=lambda x: x['timestamp'])
    except Exception as e:
        print(f"DynamoDB Read Error: {e}")
        return []

def save_message(doc_id: str, role: str, content: str):
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