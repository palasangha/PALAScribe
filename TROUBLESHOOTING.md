# Whisper Backend Startup Troubleshooting Guide

## Common Issues and Solutions

### 1. "Failed to start" Error

**Symptoms:**
- Running `./auto-whisper.sh start` shows "❌ Failed to start Whisper server"
- The launcher shows "Backend not running"

**Solutions:**

#### Check System Requirements
```bash
# Run diagnostics
./auto-whisper.sh diagnose

# Check if virtual environment exists
ls -la whisper-env/

# Check if Python and Whisper are installed
source whisper-env/bin/activate
python3 --version
pip list | grep whisper
```

#### Check for Port Conflicts
```bash
# Check if port 8765 is in use
lsof -i :8765

# If another process is using port 8765, kill it
sudo lsof -i :8765
# Then kill the process using the PID shown
```

#### Check Permissions
```bash
# Make sure the script is executable
chmod +x auto-whisper.sh

# Check file permissions
ls -la whisper_server.py
ls -la auto-whisper.sh
```

### 2. Virtual Environment Issues

**Symptoms:**
- "Virtual environment not found" error
- Python or Whisper import errors

**Solutions:**

#### Recreate Virtual Environment
```bash
# Remove existing environment
rm -rf whisper-env/

# Create new environment
python3 -m venv whisper-env
source whisper-env/bin/activate

# Install dependencies
pip install --upgrade pip
pip install openai-whisper torch numpy

# Test installation
python3 -c "import whisper; print('Whisper installed successfully')"
```

#### Fix Python Path Issues
```bash
# Make sure you're using the right Python
which python3
python3 --version

# If using Homebrew Python
brew install python@3.12
```

### 3. Server Won't Start

**Symptoms:**
- Server starts but immediately stops
- No response to health check

**Solutions:**

#### Check Server Logs
```bash
# View recent logs
./auto-whisper.sh logs

# Or check log file directly
tail -50 whisper_server.log
```

#### Common Log Errors and Fixes

**Error: "Address already in use"**
```bash
# Find and kill process using port 8765
lsof -i :8765
kill -9 <PID>
```

**Error: "ModuleNotFoundError: No module named 'whisper'"**
```bash
# Reinstall Whisper
source whisper-env/bin/activate
pip uninstall openai-whisper
pip install openai-whisper
```

**Error: "Permission denied"**
```bash
# Fix permissions
chmod +x auto-whisper.sh
chmod 644 whisper_server.py
```

### 4. Web Interface Issues

**Symptoms:**
- "Backend not running" in browser
- Connection timeouts

**Solutions:**

#### Test Backend Connection
```bash
# Test health endpoint
curl -v http://localhost:8765/health

# Test from browser
# Open: http://localhost:8765/health
```

#### Check Firewall/Security
```bash
# On macOS, allow Python network access
# System Preferences > Security & Privacy > Firewall
# Allow Python to accept incoming connections
```

### 5. Performance Issues

**Symptoms:**
- Slow startup
- High CPU usage
- Memory issues

**Solutions:**

#### Reduce Whisper Model Size
Edit `whisper_server.py` and change the model:
```python
# Change from 'medium' to 'small' or 'tiny'
model = whisper.load_model("small")
```

#### Check System Resources
```bash
# Monitor resources
top -pid $(cat .whisper_server.pid)
```

### 6. Complete Reset

If nothing else works, try a complete reset:

```bash
# Stop everything
./auto-whisper.sh stop
pkill -f whisper_server.py

# Clean up
rm -f .whisper_server.pid
rm -f whisper_server.log

# Remove virtual environment
rm -rf whisper-env/

# Reinstall everything
python3 -m venv whisper-env
source whisper-env/bin/activate
pip install --upgrade pip
pip install openai-whisper torch numpy

# Test
python3 -c "import whisper; print('Installation successful')"

# Start fresh
./auto-whisper.sh start
```

## Quick Diagnostic Commands

```bash
# Full system check
./auto-whisper.sh diagnose

# Check server status
./auto-whisper.sh status

# View live logs
./auto-whisper.sh logs

# Test health endpoint
curl http://localhost:8765/health

# Check process
ps aux | grep whisper_server
```

## Getting Help

If you're still having issues:

1. Run `./auto-whisper.sh diagnose` and save the output
2. Check the log file: `cat whisper_server.log`
3. Try the steps in "Complete Reset" section
4. Check the GitHub issues for similar problems

## Manual Startup (Alternative)

If the script doesn't work, you can start manually:

```bash
# Navigate to project directory
cd "/Users/vijayaraghavanvedantham/Documents/VRI Tech Projects/audio-text-converter"

# Activate virtual environment
source whisper-env/bin/activate

# Start server directly
python3 whisper_server.py
```

The server should start on http://localhost:8765
