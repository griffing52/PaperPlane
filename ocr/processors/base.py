from abc import ABC, abstractmethod
from typing import List, Dict, Any
from pydantic import BaseModel

# Shared models
class FlightEntry(BaseModel):
    date: str
    tailNumber: str
    srcIcao: str
    destIcao: str
    totalFlightTime: float
    picTime: float
    dualReceivedTime: float
    instrumentTime: float
    crossCountry: bool
    night: bool
    solo: bool
    dayLandings: int
    nightLandings: int
    remarks: str

class OCRResult(BaseModel):
    message: str
    records: List[FlightEntry]

class OCRProcessor(ABC):
    @abstractmethod
    async def process_image(self, file_bytes: bytes, mime_type: str = "image/jpeg") -> OCRResult:
        """
        Process the image bytes and return the extracted flight records.
        """
        pass
