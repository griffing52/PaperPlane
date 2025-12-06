# To try out the endpoint, first install dependencies: 
# pip install fastapi "uvicorn[standard]" pydantic boto3 python-multipart python-dotenv
# Then, inside ocr directory, run:
# uvicorn main:app --reload 
# And navigate to http://127.0.0.1:8000/docs

"""
Gemini Prompts 
# Prompt 1
You are an expert full-stack developer with experience using Next.js.

I'm building an app where pilots-in-training can upload photos of their logbook pages and their flight data (destination & source airports, hours spent in flight, number of landings, etc) is scanned w/ OCR and digitized, allowing them to upload their entire flight history and view their cumulative number of hours, as well as progress towards their pilot's license. 

The app is in Next.js and we are using the Python implementation of AWS Textract for OCR. Right now, I need to write FastAPI endpoints which the frontend can use to call AWS Textract after the use uploads an image of a logbook page to be parsed and stored. 

Don't write any code yet, but provide a high-level start-to-end overview of how a PNG can be parsed with AWS Textract and the data stored in a digital database (I'm not sure which database we're using, but I know we're using Prisma), including a discussion of the role of the FastAPI endpoints.

# Prompt 2
Give me an overview of possible FastAPI endpoints for the OCR service. 

# Prompt 3
Please give me a Python FastAPI implementation. 
"""

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

