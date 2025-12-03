from abc import ABC, abstractmethod
from typing import List, Dict, Any
from pydantic import BaseModel

# Shared models
class FlightRecord(BaseModel):
    date: str
    aircraft_type: str
    tail_number: str
    source_airport: str
    destination_airport: str
    total_time: float
    pic_hours: float
    instrument_hours: float
    night_hours: float
    landings_day: int
    landings_night: int
    remarks: str

class OCRResult(BaseModel):
    message: str
    records: List[FlightRecord]

class OCRProcessor(ABC):
    @abstractmethod
    async def process_image(self, file_bytes: bytes, mime_type: str = "image/jpeg") -> OCRResult:
        """
        Process the image bytes and return the extracted flight records.
        """
        pass
