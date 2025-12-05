# To try out the endpoint, first install dependencies: 
# pip install fastapi "uvicorn[standard]" pydantic boto3 python-multipart python-dotenv
# Then, inside ocr directory, run:
# uvicorn main:app --reload 
# And navigate to http://127.0.0.1:8000/docs

import os
from typing import Dict, Any, List
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from processors import AWSOCRProcessor, GeminiOCRProcessor, OCRResult, HybridOCRProcessor

# Load environment variables from .env file
load_dotenv('../.env')

# Configuration
# TODO: Use environment variables
OCR_PROVIDER = os.getenv("OCR_PROVIDER", "AWS") # Options: AWS, GEMINI, HYBRID

app = FastAPI(
    title="Logbook OCR Service",
    description="Modular OCR service supporting AWS Textract and Gemini."
)

origins = [
    "*"  # In production, restrict this to your frontend domain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_processor():
    if OCR_PROVIDER == "GEMINI":
        print("Using Gemini OCR Processor")
        return GeminiOCRProcessor()

    if OCR_PROVIDER == "HYBRID":
        print("Using Hybrid OCR Processor")
        return HybridOCRProcessor()
    
    print("Using AWS OCR Processor")
    return AWSOCRProcessor()

@app.post(
    "/ocr/process",
    response_model=OCRResult,
    status_code=200
)
async def process_logbook(
    file: UploadFile = File(..., description="Image of the logbook page (PNG or JPEG, Max 5MB)")
):
    """
    Uploads a single-page image and processes it using the configured OCR provider.
    """
    # 1. Read file bytes
    file_bytes = await file.read()
    
    # 2. Validate file size and type
    if file.content_type not in ["image/png", "image/jpeg"]:
        raise HTTPException(status_code=400, detail="File must be a PNG or JPEG image.")
    
    # Size limit might depend on provider, but keeping 5MB as a safe default for now
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File size exceeds the 5MB limit.")

    try:
        processor = get_processor()
        result = await processor.process_image(file_bytes, mime_type=file.content_type)
        return result

    except Exception as e:
        print(f"Processing Error: {e}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")
