import requests
import json
import sys

url = "http://localhost:8000/ocr/process"

def test_ocr_endpoint(image_path: str):
    with open(image_path, "rb") as f:
        files = {"file": (image_path, f, "image/jpeg")}
        response = requests.post(url, files=files)
        
        if response.status_code == 200:
            print("OCR Processing Successful!")
            print("Response JSON:")
            print(json.dumps(response.json(), indent=4))
        else:
            print(f"OCR Processing Failed with status code {response.status_code}")
            print("Response Text:")
            print(response.text)


if __name__ == "__main__":
    # Replace use path of first cli argument with path to a test image file
    test_image_path = sys.argv[1] if len(sys.argv) > 1 else "test_images/custom_example.png"
    test_ocr_endpoint(test_image_path)