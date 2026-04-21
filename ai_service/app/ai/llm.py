import os
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()

api_key_val = os.getenv("GROQ_API_KEY")

if not api_key_val:
    raise ValueError("GROQ_API_KEY is not found in environment variables!")

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    groq_api_key=api_key_val  
)