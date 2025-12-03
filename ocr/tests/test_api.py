import os
import json
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import sys

# Add the parent directory to sys.path to import main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app, get_processor
from processors import FlightRecord

client = TestClient(app)

# Mock Data
MOCK_FLIGHT_RECORD = {
    "date": "2025-01-15",
    "aircraft_type": "C172",
    "tail_number": "N12345",
    "source_airport": "KSMO",
    "destination_airport": "KSAN",
    "total_time": 1.5,
    "pic_hours": 1.5,
    "instrument_hours": 0.0,
    "night_hours": 0.0,
    "landings_day": 2,
    "landings_night": 0,
    "remarks": "Test Flight"
}

MOCK_TEXTRACT_RESPONSE = {
    "Blocks": [
        {"Id": "table1", "BlockType": "TABLE", "Relationships": [{"Type": "CHILD", "Ids": ["cell1", "cell2", "cell3"]}]},
        {"Id": "cell1", "BlockType": "CELL", "RowIndex": 1, "ColumnIndex": 1, "Relationships": [{"Type": "CHILD", "Ids": ["word1"]}]},
        {"Id": "word1", "BlockType": "WORD", "Text": "Date"},
        {"Id": "cell2", "BlockType": "CELL", "RowIndex": 1, "ColumnIndex": 2, "Relationships": [{"Type": "CHILD", "Ids": ["word2"]}]},
        {"Id": "word2", "BlockType": "WORD", "Text": "Total"},
        {"Id": "cell3", "BlockType": "CELL", "RowIndex": 1, "ColumnIndex": 3, "Relationships": [{"Type": "CHILD", "Ids": ["word3"]}]},
        {"Id": "word3", "BlockType": "WORD", "Text": "Remarks"},
        
        # Data Row
        {"Id": "cell4", "BlockType": "CELL", "RowIndex": 2, "ColumnIndex": 1, "Relationships": [{"Type": "CHILD", "Ids": ["word4"]}]},
        {"Id": "word4", "BlockType": "WORD", "Text": "2025-01-15"},
        {"Id": "cell5", "BlockType": "CELL", "RowIndex": 2, "ColumnIndex": 2, "Relationships": [{"Type": "CHILD", "Ids": ["word5"]}]},
        {"Id": "word5", "BlockType": "WORD", "Text": "1.5"},
        {"Id": "cell6", "BlockType": "CELL", "RowIndex": 2, "ColumnIndex": 3, "Relationships": [{"Type": "CHILD", "Ids": ["word6"]}]},
        {"Id": "word6", "BlockType": "WORD", "Text": "Test Flight"},
    ]
}

@pytest.fixture
def mock_image():
    return b"fake_image_bytes"

@pytest.fixture
def mock_aws_client():
    with patch("boto3.client") as mock:
        client_instance = MagicMock()
        client_instance.analyze_document.return_value = MOCK_TEXTRACT_RESPONSE
        mock.return_value = client_instance
        yield client_instance

@pytest.fixture
def mock_gemini_client():
    with patch("google.genai.Client") as mock:
        client_instance = MagicMock()
        # Mock the generate_content response
        response_mock = MagicMock()
        response_mock.text = json.dumps([MOCK_FLIGHT_RECORD])
        client_instance.models.generate_content.return_value = response_mock
        mock.return_value = client_instance
        yield client_instance

def test_aws_processor_pipeline(mock_aws_client, mock_image):
    """
    Tests the AWS pipeline by mocking boto3.
    """
    # Patch get_processor to return AWS processor
    with patch("main.OCR_PROVIDER", "AWS"):
        # We need to reload or just patch the function that uses the var?
        # Since get_processor reads the global, patching the global in main module works if done right.
        # But simpler is to patch get_processor itself.
        from processors import AWSOCRProcessor
        processor = AWSOCRProcessor()
        
        with patch("main.get_processor", return_value=processor):
            response = client.post(
                "/ocr/process",
                files={"file": ("test.jpg", mock_image, "image/jpeg")}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "records" in data
            assert len(data["records"]) > 0
            assert data["records"][0]["date"] == "2025-01-15"
            assert data["records"][0]["total_time"] == 1.5

def test_gemini_processor_pipeline(mock_gemini_client, mock_image):
    """
    Tests the Gemini pipeline by mocking google.genai.
    """
    from processors import GeminiOCRProcessor
    # Mock the API key check
    with patch.dict(os.environ, {"GEMINI_API_KEY": "fake_key"}):
        processor = GeminiOCRProcessor(api_key="fake_key")
        
        with patch("main.get_processor", return_value=processor):
            response = client.post(
                "/ocr/process",
                files={"file": ("test.jpg", mock_image, "image/jpeg")}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert len(data["records"]) == 1
            assert data["records"][0]["tail_number"] == "N12345"

def test_hybrid_processor_pipeline(mock_aws_client, mock_gemini_client, mock_image):
    """
    Tests the Hybrid pipeline by mocking both boto3 and google.genai.
    """
    from processors import HybridOCRProcessor
    
    with patch.dict(os.environ, {"GEMINI_API_KEY": "fake_key"}):
        processor = HybridOCRProcessor(api_key="fake_key")
        
        with patch("main.get_processor", return_value=processor):
            response = client.post(
                "/ocr/process",
                files={"file": ("test.jpg", mock_image, "image/jpeg")}
            )
            
            assert response.status_code == 200
            data = response.json()
            # Hybrid uses Gemini to parse, so it should return the mocked Gemini response
            assert len(data["records"]) == 1
            assert data["records"][0]["remarks"] == "Test Flight"
            
            # Verify AWS was called
            mock_aws_client.analyze_document.assert_called_once()
            # Verify Gemini was called
            mock_gemini_client.models.generate_content.assert_called_once()

def test_invalid_file_type():
    response = client.post(
        "/ocr/process",
        files={"file": ("test.txt", b"text content", "text/plain")}
    )
    assert response.status_code == 400
    assert "File must be a PNG or JPEG" in response.json()["detail"]
