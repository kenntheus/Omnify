#!/usr/bin/env bash
set -e
pip install -r requirements.txt
python -m spacy download en_core_web_sm || true
python -m playwright install chromium
echo "AI service setup complete."
