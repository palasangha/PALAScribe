#!/bin/bash
# Start the Local Whisper Server

echo "🎵 Starting Local Whisper Server..."

# Navigate to the project directory
cd "$(dirname "$0")"

# Check if whisper-env exists
if [ ! -d "whisper-env" ]; then
    echo "❌ Virtual environment 'whisper-env' not found!"
    echo "Please run the whisper setup first."
    exit 1
fi

# Check if whisper is installed
if [ ! -f "whisper-env/bin/whisper" ]; then
    echo "❌ Whisper not found in virtual environment!"
    echo "Please install Whisper in the virtual environment."
    exit 1
fi

# Activate virtual environment and start server
echo "🚀 Activating virtual environment and starting server..."
source whisper-env/bin/activate
python3 whisper_server.py
