#!/bin/bash
# Port Verification Script for PALAScribe
# This script checks what ports are actually in use and helps identify the correct configuration

echo "🔍 PALAScribe Port Verification"
echo "================================"
echo ""

# Check what's running on the expected ports
echo "🔎 Checking common ports for PALAScribe services..."
echo ""

ports=(8000 8080 8765 8766 8767)

for port in "${ports[@]}"; do
    echo "Port $port:"
    # Check if something is listening on this port
    if lsof -i :$port >/dev/null 2>&1; then
        echo "  ✅ ACTIVE - Something is running on port $port"
        echo "  📋 Details:"
        lsof -i :$port | head -5
    else
        echo "  ❌ INACTIVE - Nothing running on port $port"
    fi
    echo ""
done

echo "🧭 Configuration Check:"
echo "======================"

# Check auto-whisper.sh configuration
if [ -f "auto-whisper.sh" ]; then
    server_port=$(grep "SERVER_PORT=" auto-whisper.sh | cut -d'=' -f2)
    echo "📄 auto-whisper.sh configured for port: $server_port"
else
    echo "⚠️  auto-whisper.sh not found"
fi

# Check config.js
if [ -f "js/config.js" ]; then
    backend_url=$(grep "BACKEND_URL" js/config.js | head -1)
    echo "📄 config.js backend URL: $backend_url"
else
    echo "⚠️  js/config.js not found"
fi

echo ""
echo "🚀 Quick Actions:"
echo "================"
echo "To start server on port 8765: python whisper_server.py"
echo "To kill process on port 8765: lsof -ti:8765 | xargs kill -9"
echo "To test connection: curl http://localhost:8765/health"
echo ""

# Try to detect if any whisper/palascribe processes are running
echo "🔍 Looking for PALAScribe/Whisper processes:"
echo "============================================"
ps aux | grep -i "whisper\|palascribe" | grep -v grep | head -5
if [ $? -ne 0 ]; then
    echo "  ❌ No PALAScribe/Whisper processes found"
fi

echo ""
echo "💡 Recommendation:"
echo "=================="
echo "1. Kill any existing processes: lsof -ti:8765 | xargs kill -9"
echo "2. Start the server: python whisper_server.py"
echo "3. Verify it's running: curl http://localhost:8765/health"
echo "4. Open the frontend: open index.html"
