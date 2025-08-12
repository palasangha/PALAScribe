#!/bin/bash

# PALAScribe Consolidated Server Startup Script
# This script starts the single consolidated server that handles:
# - Multi-user project management
# - Database persistence  
# - Whisper audio transcription
# - Pali Buddhist terminology correction

PROJECT_DIR="./"
SERVER_PORT=8765

echo "🚀 Starting PALAScribe Consolidated Server..."
echo "📂 Project Directory: $PROJECT_DIR"
echo "🔗 Server Port: $SERVER_PORT"
echo ""

# Change to project directory
cd "$PROJECT_DIR"

# Check if virtual environment exists and activate it
if [ -d "whisper-env" ]; then
    echo "🐍 Activating Python virtual environment..."
    source whisper-env/bin/activate
fi

# Check if port is already in use
if lsof -Pi :$SERVER_PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port $SERVER_PORT is already in use!"
    echo "🔍 Checking what's running..."
    lsof -i :$SERVER_PORT
    echo ""
    echo "💡 To kill existing process:"
    echo "   lsof -ti:$SERVER_PORT | xargs kill -9"
    echo ""
    echo "❓ Continue anyway? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Startup cancelled"
        exit 1
    fi
fi
#for changes for palascribe server to listen in all ips
echo "✅ Starting consolidated PALAScribe server..."
echo "🎯 All services available on: http://0.0.0.0:$SERVER_PORT"
echo ""
echo "📊 Available endpoints:"
echo "   - GET  /health - Health check"
echo "   - GET  /projects - List projects"  
echo "   - POST /projects - Create project"
echo "   - POST /projects/{id}/transcribe - Transcribe audio"
echo "   - POST /process - Direct Whisper processing (legacy)"
echo ""
echo "📱 Web Interface: http://0.0.0.0:$SERVER_PORT" 
echo ""

# Start the server
python3 palascribe_server.py
