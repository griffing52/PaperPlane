import os
import json
from typing import Dict, Any, List
from .base import OCRProcessor, OCRResult, FlightRecord
from .aws_processor import AWSOCRProcessor

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("Warning: google-genai package not found. Gemini processor will not work.")

class HybridOCRProcessor(AWSOCRProcessor):
    """
    Uses AWS Textract to extract text/tables, then uses Gemini to parse the text into structured data.
    Inherits from AWSOCRProcessor to reuse Textract connection and CSV generation logic.
    """
    def __init__(self, region_name: str = "us-west-1", api_key: str = None):
        super().__init__(region_name=region_name)
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if self.api_key:
             self.gemini_client = genai.Client(api_key=self.api_key)
        else:
             try:
                self.gemini_client = genai.Client()
             except:
                self.gemini_client = None

    async def process_image(self, file_bytes: bytes, mime_type: str = "image/jpeg") -> OCRResult:
        if not self.gemini_client:
            raise ValueError("Gemini Client not initialized. Check API Key.")
        
        textract_response = self.analyze_document(file_bytes)


        csv_text = self.get_all_tables_as_csv(textract_response)

        if not csv_text:
             return OCRResult(
                message="No tables found by Textract.",
                raw_data=textract_response,
                records=[]
            )

        # Send CSV to Gemini for parsing
        prompt = f"""
        I have extracted the following table data from a pilot logbook using OCR.
        Please parse this data into a JSON array of flight records.
        
        CSV Data:
        {csv_text}

        Return ONLY a JSON array of objects with the following keys:
        - date (string, YYYY-MM-DD)
        - aircraft_type (string)
        - tail_number (string)
        - source_airport (string)
        - destination_airport (string)
        - total_time (float)
        - pic_hours (float)
        - instrument_hours (float)
        - night_hours (float)
        - landings_day (int)
        - landings_night (int)
        - remarks (string)

        If a field is empty or unreadable, use null or 0 for numbers and empty string for strings.
        Ensure the JSON is valid.
        """

        try:
            response = self.gemini_client.models.generate_content(
                model='gemini-2.0-flash',
                contents=[prompt]
            )
            
            # Parsing!!!!
            text_response = response.text.strip()
            if text_response.startswith("```json"):
                text_response = text_response[7:]
            if text_response.startswith("```"):
                text_response = text_response[3:]
            if text_response.endswith("```"):
                text_response = text_response[:-3]
            
            data = json.loads(text_response.strip())
            
            records = []
            if isinstance(data, list):
                for item in data:
                    records.append(FlightRecord(**item))
            
            return OCRResult(
                message=f"Successfully processed {len(records)} records with Hybrid (Textract -> Gemini)",
                raw_data={"textract": textract_response, "gemini_text": response.text},
                records=records
            )

        except Exception as e:
            print(f"Hybrid Processing Error: {e}")
            raise e
