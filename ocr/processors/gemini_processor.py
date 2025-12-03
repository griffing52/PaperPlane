import os
import json
from typing import Dict, Any, List
from .base import OCRProcessor, OCRResult, FlightEntry
try:
    from google import genai
    from google.genai import types
except ImportError:
    print("Warning: google-genai package not found. Gemini processor will not work.")

class GeminiOCRProcessor(OCRProcessor):
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        # Initialize Gemini client
        if self.api_key:
             self.client = genai.Client(api_key=self.api_key)
        else:
             # Attempt to use default env var GOOGLE_API_KEY if set, or let it fail later if used
             try:
                self.client = genai.Client()
             except:
                self.client = None

    async def process_image(self, file_bytes: bytes, mime_type: str = "image/jpeg") -> OCRResult:
        if not self.client:
            raise ValueError("Gemini Client not initialized. Check API Key.")

        prompt = """
        Extract flight logbook entries from this image.
        Return ONLY a JSON array of objects with the following keys:
        - date (string, YYYY-MM-DD)
        - tailNumber (string)
        - srcIcao (string, 4-letter airport code)
        - destIcao (string, 4-letter airport code)
        - totalFlightTime (float)
        - picTime (float)
        - dualReceivedTime (float)
        - instrumentTime (float)
        - crossCountry (boolean, parse from remarks if present)
        - night (boolean, parse from remarks if present)
        - solo (boolean, parse from remarks if present)
        - dayLandings (int)
        - nightLandings (int)
        - remarks (string)

        For boolean flags: search the remarks/notes for keywords like 'cross-country', 'xc', 'night', 'nvg', or 'solo'.
        If a field is empty or unreadable, use null or 0 for numbers, false for booleans, and empty string for strings.
        Ensure the JSON is valid. Do not include markdown formatting like ```json.
        """

        try:
            response = self.client.models.generate_content(
                model='gemini-2.0-flash',
                contents=[
                    types.Part.from_bytes(
                        data=file_bytes,
                        mime_type=mime_type,
                    ),
                    prompt
                ]
            )
            
            # Parsing!!!!
            text_response = response.text.strip()
            # Clean markdown if present (just in case :O )
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
                    records.append(FlightEntry(**item))
            
            return OCRResult(
                message=f"Successfully processed {len(records)} records with Gemini",
                records=records
            )

        except Exception as e:
            print(f"Gemini Processing Error: {e}")
            raise e
