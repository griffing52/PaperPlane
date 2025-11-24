from fastapi import FastAPI

app = FastAPI()
@app.get("/api/process")
def process():
    return {"message": "Processing OCR..."}