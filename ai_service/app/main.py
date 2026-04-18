from fastapi import FastAPI

app = FastAPI(
    title="Collabrix AI Service",
    root_path="/ai"
)

@app.get("/")
def home():
    return {"status": "AI Service Online", "service": "Collabrix-AI"}

@app.post("/process") 
def process(data: dict):
    return {"result": "AI successfully processed your request"}