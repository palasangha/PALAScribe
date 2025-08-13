#!/bin/bash
# Auto-start Whisper Server Script
# This script checks if the server is running and starts it if needed

PROJECT_DIR="./"
SERVER_PORT=8765
VENV_PATH="$PROJECT_DIR/whisper-env"
SERVER_SCRIPT="$PROJECT_DIR/whisper_server.py"
PID_FILE="$PROJECT_DIR/.whisper_server.pid"

cd "$PROJECT_DIR" || exit 1

# Function to check if server is running
check_server_running() {
    curl -s http://0.0.0.0:$SERVER_PORT/health > /dev/null 2>&1
    return $?
}

# Function to check if process is running from PID file
check_pid_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Function to start the server
start_server() {
    echo "🚀 Starting Whisper server automatically..."
    
    # Check if virtual environment exists
    if [ ! -d "$VENV_PATH" ]; then
        echo "❌ Virtual environment not found at $VENV_PATH"
        echo "💡 Please run the setup script first"
        return 1
    fi
    
    # Check if server script exists
    if [ ! -f "$SERVER_SCRIPT" ]; then
        echo "❌ Server script not found at $SERVER_SCRIPT"
        return 1
    fi
    
    # Check if port is already in use
    if lsof -i :$SERVER_PORT > /dev/null 2>&1; then
        echo "⚠️  Port $SERVER_PORT is already in use"
        echo "🔍 Checking if it's our Whisper server..."
        if check_server_running; then
            echo "✅ Whisper server is already running"
            return 0
        else
            echo "❌ Another process is using port $SERVER_PORT"
            echo "💡 Please stop the other process or change the port"
            return 1
        fi
    fi
    
    # Start the server in background
    echo "🔄 Activating virtual environment..."
    source "$VENV_PATH/bin/activate"
    
    echo "🔄 Starting server on port $SERVER_PORT..."
    nohup python3 "$SERVER_SCRIPT" > "$PROJECT_DIR/whisper_server.log" 2>&1 &
    local server_pid=$!
    
    # Save PID
    echo $server_pid > "$PID_FILE"
    echo "📝 Server PID: $server_pid"
    
    # Wait and check if it started successfully (with longer timeout)
    echo "🔄 Waiting for server to start..."
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        sleep 1
        if check_server_running; then
            echo "✅ Whisper server started successfully (PID: $server_pid)"
            echo "📝 Logs: $PROJECT_DIR/whisper_server.log"
            echo "🌐 Health check: http://0.0.0.0:$SERVER_PORT/health"
            return 0
        fi
        echo "⏳ Attempt $attempt/$max_attempts..."
        attempt=$((attempt + 1))
    done
    
    # If we get here, startup failed
    echo "❌ Failed to start Whisper server after $max_attempts attempts"
    echo "📝 Check logs for details: $PROJECT_DIR/whisper_server.log"
    
    # Show last few lines of log
    if [ -f "$PROJECT_DIR/whisper_server.log" ]; then
        echo "📋 Last 5 lines of log:"
        tail -5 "$PROJECT_DIR/whisper_server.log"
    fi
    
    # Clean up
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo "🛑 Stopping failed server process..."
            kill "$pid"
        fi
        rm -f "$PID_FILE"
    fi
    
    return 1
}

# Function to stop the server
stop_server() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo "🛑 Stopping Whisper server (PID: $pid)..."
            kill "$pid"
            rm -f "$PID_FILE"
            echo "✅ Server stopped"
        else
            echo "🔍 Server process not found, cleaning up PID file"
            rm -f "$PID_FILE"
        fi
    else
        echo "📄 No PID file found"
    fi
}

# Function to show diagnostic information
show_diagnostics() {
    echo "🔍 Whisper Backend Diagnostics"
    echo "=============================="
    echo "📁 Project Directory: $PROJECT_DIR"
    echo "🐍 Virtual Environment: $VENV_PATH"
    echo "📄 Server Script: $SERVER_SCRIPT"
    echo "🔧 Server Port: $SERVER_PORT"
    echo "📝 PID File: $PID_FILE"
    echo "📋 Log File: $PROJECT_DIR/whisper_server.log"
    echo
    
    # Check virtual environment
    if [ -d "$VENV_PATH" ]; then
        echo "✅ Virtual environment exists"
        if [ -f "$VENV_PATH/bin/python3" ]; then
            echo "✅ Python3 found in virtual environment"
        else
            echo "❌ Python3 not found in virtual environment"
        fi
    else
        echo "❌ Virtual environment not found"
    fi
    
    # Check server script
    if [ -f "$SERVER_SCRIPT" ]; then
        echo "✅ Server script exists"
    else
        echo "❌ Server script not found"
    fi
    
    # Check port
    if lsof -i :$SERVER_PORT > /dev/null 2>&1; then
        echo "⚠️  Port $SERVER_PORT is in use"
        lsof -i :$SERVER_PORT
    else
        echo "✅ Port $SERVER_PORT is available"
    fi
    
    # Check if process is running
    if check_pid_running; then
        echo "✅ Server process is running"
    else
        echo "❌ Server process is not running"
    fi
    
    # Check if server responds
    if check_server_running; then
        echo "✅ Server responds to health check"
    else
        echo "❌ Server does not respond to health check"
    fi
    
    # Show recent logs
    if [ -f "$PROJECT_DIR/whisper_server.log" ]; then
        echo
        echo "📋 Recent logs (last 10 lines):"
        tail -10 "$PROJECT_DIR/whisper_server.log"
    else
        echo "📋 No log file found"
    fi
}

# Main logic
case "${1:-auto}" in
    "start")
        if check_server_running; then
            echo "✅ Whisper server is already running"
        else
            start_server
        fi
        ;;
    "stop")
        stop_server
        ;;
    "restart")
        stop_server
        sleep 1
        start_server
        ;;
    "status")
        if check_server_running; then
            echo "✅ Whisper server is running"
            if [ -f "$PID_FILE" ]; then
                echo "📋 PID: $(cat "$PID_FILE")"
            fi
        else
            echo "❌ Whisper server is not running"
        fi
        ;;
    "auto")
        # Auto mode: start only if not running
        if check_server_running || check_pid_running; then
            echo "✅ Whisper server is already running"
        else
            start_server
        fi
        ;;
    "diagnose")
        show_diagnostics
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|auto|diagnose}"
        echo "  start    - Start the server"
        echo "  stop     - Stop the server" 
        echo "  restart  - Restart the server"
        echo "  status   - Check server status"
        echo "  auto     - Start server only if not running (default)"
        echo "  diagnose  - Show diagnostic information"
        exit 1
        ;;
esac
