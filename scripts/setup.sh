#!/bin/bash

npm install
python -m venv .venv
source .venv/bin/activate
pip install -r ocr/requirements.txt
echo "Setup complete!"