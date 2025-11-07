// run by using command: node ocr/image_processing.js


import Tesseract from 'tesseract.js';

async function performOcr(imagePath, language = 'eng') {
  try {
    const { data: { text } } = await Tesseract.recognize(
      imagePath,
      language,
      { logger: m => console.log(m) } // Optional: Log progress
    );
    console.log('Extracted Text:', text);
    return text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
}

// Example usage:
// Replace 'path/to/your/image.png' with the actual path to your image file
// or use a URL like 'https://example.com/image.jpg'
const imageToProcess = './ocr/example.png'; 

performOcr(imageToProcess, 'eng') // 'eng' for English, change for other languages
  .then(extractedText => {
    console.log('OCR process completed.');
  })
  .catch(error => {
    console.error('Failed to perform OCR:', error);
  });