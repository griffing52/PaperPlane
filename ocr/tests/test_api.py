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
    "date": "1/10/2025",
    "aircraft_type": "Cessna 172S",
    "tail_number": "N54321",
    "source_airport": "KSMO",
    "destination_airport": "KSBA",
    "total_time": 1.5,
    "pic_hours": 0.8,
    "instrument_hours": 0.4,
    "night_hours": 0.0,
    "landings_day": 3,
    "landings_night": 0,
    "remarks": "Local VFR flight, steep turns"
}

MOCK_TEXTRACT_RESPONSE = {
    "Blocks": [
        {"Id": "table1", "BlockType": "TABLE", "Relationships": [{"Type": "CHILD", "Ids": [
            "cell_1_1", "cell_1_2", "cell_1_3", "cell_1_4", "cell_1_5", "cell_1_6", 
            "cell_1_7", "cell_1_8", "cell_1_9", "cell_1_10", "cell_1_11", "cell_1_12",
            "cell_2_1", "cell_2_2", "cell_2_3", "cell_2_4", "cell_2_5", "cell_2_6", 
            "cell_2_7", "cell_2_8", "cell_2_9", "cell_2_10", "cell_2_11", "cell_2_12"
        ]}]},
        
        # Header Row
        {"Id": "cell_1_1", "BlockType": "CELL", "RowIndex": 1, "ColumnIndex": 1, "Relationships": [{"Type": "CHILD", "Ids": ["word_1_1"]}]},
        {"Id": "word_1_1", "BlockType": "WORD", "Text": "Date"},
        {"Id": "cell_1_2", "BlockType": "CELL", "RowIndex": 1, "ColumnIndex": 2, "Relationships": [{"Type": "CHILD", "Ids": ["word_1_2"]}]},
        {"Id": "word_1_2", "BlockType": "WORD", "Text": "Aircraft Type"},
        {"Id": "cell_1_3", "BlockType": "CELL", "RowIndex": 1, "ColumnIndex": 3, "Relationships": [{"Type": "CHILD", "Ids": ["word_1_3"]}]},
        {"Id": "word_1_3", "BlockType": "WORD", "Text": "Tail Number"},
        {"Id": "cell_1_4", "BlockType": "CELL", "RowIndex": 1, "ColumnIndex": 4, "Relationships": [{"Type": "CHILD", "Ids": ["word_1_4"]}]},
        {"Id": "word_1_4", "BlockType": "WORD", "Text": "Source Airport"},
        {"Id": "cell_1_5", "BlockType": "CELL", "RowIndex": 1, "ColumnIndex": 5, "Relationships": [{"Type": "CHILD", "Ids": ["word_1_5"]}]},
        {"Id": "word_1_5", "BlockType": "WORD", "Text": "Destination Airport"},
        {"Id": "cell_1_6", "BlockType": "CELL", "RowIndex": 1, "ColumnIndex": 6, "Relationships": [{"Type": "CHILD", "Ids": ["word_1_6"]}]},
        {"Id": "word_1_6", "BlockType": "WORD", "Text": "Total Time (hrs)"},
        {"Id": "cell_1_7", "BlockType": "CELL", "RowIndex": 1, "ColumnIndex": 7, "Relationships": [{"Type": "CHILD", "Ids": ["word_1_7"]}]},
        {"Id": "word_1_7", "BlockType": "WORD", "Text": "PIC Hours (hrs)"},
        {"Id": "cell_1_8", "BlockType": "CELL", "RowIndex": 1, "ColumnIndex": 8, "Relationships": [{"Type": "CHILD", "Ids": ["word_1_8"]}]},
        {"Id": "word_1_8", "BlockType": "WORD", "Text": "Instrument Hours (hrs)"},
        {"Id": "cell_1_9", "BlockType": "CELL", "RowIndex": 1, "ColumnIndex": 9, "Relationships": [{"Type": "CHILD", "Ids": ["word_1_9"]}]},
        {"Id": "word_1_9", "BlockType": "WORD", "Text": "Night Hours (hrs)"},
        {"Id": "cell_1_10", "BlockType": "CELL", "RowIndex": 1, "ColumnIndex": 10, "Relationships": [{"Type": "CHILD", "Ids": ["word_1_10"]}]},
        {"Id": "word_1_10", "BlockType": "WORD", "Text": "Landings (Day)"},
        {"Id": "cell_1_11", "BlockType": "CELL", "RowIndex": 1, "ColumnIndex": 11, "Relationships": [{"Type": "CHILD", "Ids": ["word_1_11"]}]},
        {"Id": "word_1_11", "BlockType": "WORD", "Text": "Landings (Night)"},
        {"Id": "cell_1_12", "BlockType": "CELL", "RowIndex": 1, "ColumnIndex": 12, "Relationships": [{"Type": "CHILD", "Ids": ["word_1_12"]}]},
        {"Id": "word_1_12", "BlockType": "WORD", "Text": "Remarks"},

        # Data Row
        {"Id": "cell_2_1", "BlockType": "CELL", "RowIndex": 2, "ColumnIndex": 1, "Relationships": [{"Type": "CHILD", "Ids": ["word_2_1"]}]},
        {"Id": "word_2_1", "BlockType": "WORD", "Text": "1/10/2025"},
        {"Id": "cell_2_2", "BlockType": "CELL", "RowIndex": 2, "ColumnIndex": 2, "Relationships": [{"Type": "CHILD", "Ids": ["word_2_2"]}]},
        {"Id": "word_2_2", "BlockType": "WORD", "Text": "Cessna 172S"},
        {"Id": "cell_2_3", "BlockType": "CELL", "RowIndex": 2, "ColumnIndex": 3, "Relationships": [{"Type": "CHILD", "Ids": ["word_2_3"]}]},
        {"Id": "word_2_3", "BlockType": "WORD", "Text": "N54321"},
        {"Id": "cell_2_4", "BlockType": "CELL", "RowIndex": 2, "ColumnIndex": 4, "Relationships": [{"Type": "CHILD", "Ids": ["word_2_4"]}]},
        {"Id": "word_2_4", "BlockType": "WORD", "Text": "KSMO"},
        {"Id": "cell_2_5", "BlockType": "CELL", "RowIndex": 2, "ColumnIndex": 5, "Relationships": [{"Type": "CHILD", "Ids": ["word_2_5"]}]},
        {"Id": "word_2_5", "BlockType": "WORD", "Text": "KSBA"},
        {"Id": "cell_2_6", "BlockType": "CELL", "RowIndex": 2, "ColumnIndex": 6, "Relationships": [{"Type": "CHILD", "Ids": ["word_2_6"]}]},
        {"Id": "word_2_6", "BlockType": "WORD", "Text": "1.5"},
        {"Id": "cell_2_7", "BlockType": "CELL", "RowIndex": 2, "ColumnIndex": 7, "Relationships": [{"Type": "CHILD", "Ids": ["word_2_7"]}]},
        {"Id": "word_2_7", "BlockType": "WORD", "Text": "0.8"},
        {"Id": "cell_2_8", "BlockType": "CELL", "RowIndex": 2, "ColumnIndex": 8, "Relationships": [{"Type": "CHILD", "Ids": ["word_2_8"]}]},
        {"Id": "word_2_8", "BlockType": "WORD", "Text": "0.4"},
        {"Id": "cell_2_9", "BlockType": "CELL", "RowIndex": 2, "ColumnIndex": 9, "Relationships": [{"Type": "CHILD", "Ids": ["word_2_9"]}]},
        {"Id": "word_2_9", "BlockType": "WORD", "Text": "0"},
        {"Id": "cell_2_10", "BlockType": "CELL", "RowIndex": 2, "ColumnIndex": 10, "Relationships": [{"Type": "CHILD", "Ids": ["word_2_10"]}]},
        {"Id": "word_2_10", "BlockType": "WORD", "Text": "3"},
        {"Id": "cell_2_11", "BlockType": "CELL", "RowIndex": 2, "ColumnIndex": 11, "Relationships": [{"Type": "CHILD", "Ids": ["word_2_11"]}]},
        {"Id": "word_2_11", "BlockType": "WORD", "Text": "0"},
        {"Id": "cell_2_12", "BlockType": "CELL", "RowIndex": 2, "ColumnIndex": 12, "Relationships": [{"Type": "CHILD", "Ids": ["word_2_12"]}]},
        {"Id": "word_2_12", "BlockType": "WORD", "Text": "Local VFR flight, steep turns"},
    ]
}

@pytest.fixture
def mock_image():
    image_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "test_images", "custom_example.png")
    if os.path.exists(image_path):
        with open(image_path, "rb") as f:
            return f.read()
            
    # Fallback if file doesn't exist (e.g. in CI without the file), not sure what to make it though
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
            assert data["records"][0]["date"] == "1/10/2025"
            assert data["records"][0]["total_time"] == 1.5
            
            # Verify the mock was actually called
            mock_aws_client.analyze_document.assert_called_once()

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
            assert data["records"][0]["tail_number"] == "N54321"

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
            assert data["records"][0]["remarks"] == "Local VFR flight, steep turns"
            
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
