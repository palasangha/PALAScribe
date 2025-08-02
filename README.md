# PALAScribe - Advanced Audio Transcription for Pali & Dharma Content

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)](https://flask.palletsprojects.com/)
[![OpenAI Whisper](https://img.shields.io/badge/OpenAI-Whisper-orange.svg)](https://github.com/openai/whisper)

PALAScribe is a specialized web application for transcribing Pali teachings, dharma talks, and Buddhist educational content. It combines OpenAI's Whisper AI with intelligent post-processing to deliver accurate, professionally formatted transcriptions with automatic Pali term highlighting and intelligent paragraph formatting.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/palasangha/PALAScribe.git
cd PALAScribe

# Install dependencies
pip install -r requirements.txt

# Start the application
./start-palascribe.sh
```

Open your browser to `http://localhost:8080` and start transcribing!

## ✨ Key Features

- **🎯 AI-Powered Transcription**: State-of-the-art speech recognition using OpenAI Whisper
- **📝 Rich Text Editing**: Full-featured WYSIWYG editor with formatting tools
- **🔍 Pali Term Recognition**: Automatic detection and highlighting of Pali/Sanskrit terminology
- **📄 Intelligent Paragraphing**: Smart paragraph breaks based on speech patterns
- **🎵 Audio Integration**: Playback controls with keyboard shortcuts (spacebar, arrows)
- **💾 Project Management**: Organize transcriptions with status tracking and workflow
- **📊 Export Options**: Generate PDFs and download formatted text files
- **⚡ Real-time Preview**: Live preview of formatted output as you edit

## 🏗️ Architecture Overview

PALAScribe uses a modern client-server architecture:

- **Frontend**: HTML5 single-page application with vanilla JavaScript and Tailwind CSS
- **Backend**: Python Flask server with RESTful API
- **AI Engine**: OpenAI Whisper for speech-to-text processing
- **Database**: SQLite for project management and metadata storage
- **File Storage**: Local filesystem for audio file management

## 📋 Prerequisites

### System Requirements
- **Python**: 3.8 or higher
- **Node.js**: 14+ (for development tools, optional)
- **FFmpeg**: For audio processing
- **Operating System**: macOS, Linux, or Windows
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 2GB free space for models and audio files

### Required Python Packages
- Flask 2.0+
- SQLite3 (included with Python)
- OpenAI Whisper
- Audio processing libraries (librosa, soundfile)

## 🛠️ Detailed Installation Guide

### Step 1: Clone the Repository

```bash
git clone https://github.com/palasangha/PALAScribe.git
cd PALAScribe
```

### Step 2: Install System Dependencies

#### macOS (using Homebrew)
```bash
# Install FFmpeg for audio processing
brew install ffmpeg

# Install Python (if not already installed)
brew install python@3.11
```

#### Ubuntu/Debian Linux
```bash
# Update package list
sudo apt update

# Install FFmpeg and Python
sudo apt install ffmpeg python3 python3-pip python3-venv

# Install additional audio libraries
sudo apt install libsndfile1 libsox-dev
```

#### Windows
1. Install Python 3.8+ from [python.org](https://python.org)
2. Install FFmpeg:
   - Download from [ffmpeg.org](https://ffmpeg.org/download.html)
   - Extract and add to system PATH
3. Install Microsoft Visual C++ Build Tools (for some Python packages)

### Step 3: Create Python Virtual Environment

```bash
# Create virtual environment
python3 -m venv palascribe-env

# Activate virtual environment
# On macOS/Linux:
source palascribe-env/bin/activate

# On Windows:
palascribe-env\Scripts\activate
```

### Step 4: Install Python Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Install core dependencies
pip install flask
pip install openai-whisper
pip install librosa
pip install soundfile
pip install pydub

# Install additional audio processing libraries
pip install ffmpeg-python
pip install numpy
pip install torch torchvision torchaudio
```

### Step 5: Install Whisper Models

```bash
# Download Whisper models (this may take several minutes)
python -c "import whisper; whisper.load_model('base')"
python -c "import whisper; whisper.load_model('small')"

# Optional: Install larger models for better accuracy
# python -c "import whisper; whisper.load_model('medium')"
# python -c "import whisper; whisper.load_model('large')"
```

### Step 6: Initialize the Database

```bash
# Run the server once to initialize the database
python palascribe_server.py
# Stop with Ctrl+C after you see "Running on http://localhost:5000"
```

### Step 7: Make Scripts Executable (macOS/Linux)

```bash
chmod +x start-palascribe.sh
chmod +x start-whisper-server.sh
chmod +x auto-whisper.sh
```

## 🚀 Running PALAScribe

### Option 1: Automated Startup (Recommended)

```bash
# This script starts all required services
./start-palascribe.sh
```

This will:
1. Start the Whisper AI server on port 8000
2. Start the main Flask server on port 5000
3. Open the application in your default browser
4. Display status information and logs

### Option 2: Manual Startup

Start each component individually for development or troubleshooting:

#### Terminal 1: Start Whisper Server
```bash
# Activate virtual environment
source palascribe-env/bin/activate

# Start Whisper AI service
python whisper_server.py
```

#### Terminal 2: Start Main Server
```bash
# Activate virtual environment
source palascribe-env/bin/activate

# Start Flask application server
python palascribe_server.py
```

#### Terminal 3: Open Application
```bash
# Open the application in your browser
open index-server.html
# Or navigate to: file:///path/to/PALAScribe/index-server.html
```

### Option 3: Development Mode

For development with auto-reload:

```bash
# Start Flask in development mode
export FLASK_ENV=development
export FLASK_DEBUG=1
python palascribe_server.py

# In another terminal, start Whisper server
python whisper_server.py --debug
```

## 📱 Using PALAScribe

### Basic Workflow

1. **Open Application**: Navigate to `index-server.html` in your browser
2. **Create Project**: Click "New Project" and fill in project details
3. **Upload Audio**: Select an audio file (MP3, WAV, M4A supported)
4. **Choose Mode**: 
   - **Preview**: Quick 30-second transcription for testing
   - **Full**: Complete transcription of entire audio file
5. **Review & Edit**: Use the rich text editor to refine the transcription
6. **Format**: Apply automatic paragraph formatting using the toolbar button
7. **Export**: Download as PDF or text file when complete

### Keyboard Shortcuts

- **Spacebar**: Play/pause audio
- **Left Arrow**: Skip backward 10 seconds
- **Right Arrow**: Skip forward 10 seconds
- **Ctrl+B**: Bold text
- **Ctrl+I**: Italic text
- **Ctrl+U**: Underline text
- **Ctrl+S**: Save draft

### Project Status Workflow

```
New → Processing → Needs Review → Approved
```

- **New**: Project created, ready for transcription
- **Processing**: Audio being transcribed by Whisper AI
- **Needs Review**: Transcription complete, ready for editing
- **Approved**: Final version approved and ready for export

## 🔧 Configuration

### Server Configuration

Edit the configuration in `js/config.js`:

```javascript
const CONFIG = {
    PROJECT_STATUS: {
        NEW: 'New',
        PROCESSING: 'Processing', 
        NEEDS_REVIEW: 'Needs Review',
        APPROVED: 'Approved'
    },
    
    WHISPER: {
        BACKEND_URL: 'http://localhost:8000',
        TIMEOUT: 300000,              // 5 minutes
        MAX_FILE_SIZE: 500 * 1024 * 1024  // 500MB
    },
    
    UI: {
        NOTIFICATION_DURATION: 5000,
        AUTO_SAVE_INTERVAL: 30000,    // 30 seconds
        WORD_COUNT_UPDATE_DELAY: 500
    }
};
```

### Whisper Model Selection

Choose Whisper model based on your needs:

- **tiny**: Fastest, lowest accuracy (~39 MB)
- **base**: Good balance of speed and accuracy (~74 MB)
- **small**: Better accuracy, slower (~244 MB)
- **medium**: High accuracy, slower (~769 MB)
- **large**: Best accuracy, slowest (~1550 MB)

To change the model, edit `whisper_server.py`:

```python
# Change this line to use different model
model = whisper.load_model("base")  # Change to "small", "medium", etc.
```

### File Upload Limits

Adjust file size limits in `palascribe_server.py`:

```python
# Maximum file size (500MB default)
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024
```

## 🗂️ Directory Structure

```
PALAScribe/
├── Frontend Files
│   ├── index-server.html          # Main application interface
│   └── js/                        # JavaScript modules
│       ├── ui-controller-fixed.js # Main UI controller
│       ├── project-manager-server.js # Project management
│       ├── config.js              # Configuration
│       └── utils.js               # Utilities
├── Backend Files
│   ├── palascribe_server.py       # Main Flask server
│   ├── whisper_server.py          # Whisper AI integration
│   └── palascribe.db              # SQLite database
├── Startup Scripts
│   ├── start-palascribe.sh        # Main launcher
│   ├── start-whisper-server.sh    # Whisper server launcher
│   └── auto-whisper.sh            # Automatic setup
└── Storage
    └── uploads/                   # Audio file storage
```

## 🔍 Troubleshooting

### Common Issues

#### Issue: "Whisper backend not running"
**Solution**: 
```bash
# Check if Whisper server is running
curl http://localhost:8000/health

# If not running, start it manually
python whisper_server.py
```

#### Issue: "Cannot connect to server"
**Solution**:
```bash
# Check if Flask server is running
curl http://localhost:5000/api/projects

# If not running, start it
python palascribe_server.py
```

#### Issue: "Audio file upload fails"
**Solutions**:
1. Check file size (max 500MB by default)
2. Verify audio format (MP3, WAV, M4A supported)
3. Ensure FFmpeg is installed and accessible

#### Issue: "Transcription takes too long"
**Solutions**:
1. Use smaller Whisper model (tiny, base)
2. Use Preview mode for testing
3. Check system resources (CPU, memory)

#### Issue: "Module not found" errors
**Solution**:
```bash
# Ensure virtual environment is activated
source palascribe-env/bin/activate

# Reinstall missing packages
pip install -r requirements.txt
```

### Performance Optimization

#### For Better Speed:
- Use smaller Whisper models (tiny, base)
- Ensure adequate RAM (8GB+ recommended)
- Close other CPU-intensive applications
- Use SSD storage for better I/O performance

#### For Better Accuracy:
- Use larger Whisper models (medium, large)
- Ensure high-quality audio input
- Use appropriate audio preprocessing
- Test with Preview mode first

### Debug Mode

Enable debug logging:

```bash
# Set environment variables
export FLASK_DEBUG=1
export PALASCRIBE_DEBUG=1

# Start with verbose logging
python palascribe_server.py --debug
python whisper_server.py --verbose
```

## 📊 System Requirements & Performance

### Minimum Requirements
- **CPU**: 2-core processor
- **RAM**: 4GB
- **Storage**: 2GB free space
- **Network**: Not required (runs locally)

### Recommended Configuration
- **CPU**: 4+ core processor (Intel i5/AMD Ryzen 5 or better)
- **RAM**: 8GB+ (16GB for large files)
- **Storage**: 10GB+ SSD storage
- **GPU**: Optional (CUDA-compatible for faster processing)

### Performance Expectations

| Audio Length | Whisper Model | Expected Processing Time |
|--------------|---------------|-------------------------|
| 10 minutes   | tiny          | 30 seconds             |
| 10 minutes   | base          | 1-2 minutes            |
| 10 minutes   | small         | 2-3 minutes            |
| 60 minutes   | base          | 5-10 minutes           |
| 60 minutes   | medium        | 15-25 minutes          |

*Times may vary based on hardware and audio complexity*

## 🤝 Contributing

We welcome contributions! Please see our [contributing guidelines](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/PALAScribe.git

# Create development branch
git checkout -b feature/your-feature-name

# Install development dependencies
pip install -r requirements-dev.txt

# Run tests
python -m pytest tests/

# Submit pull request
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI Whisper](https://github.com/openai/whisper) for the speech recognition engine
- [Flask](https://flask.palletsprojects.com/) for the web framework
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework
- The Buddhist and Pali language communities for inspiration and guidance

## 📞 Support

- **Documentation**: See additional docs in the repository
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join community discussions on GitHub
- **Email**: Contact the development team at [support@palascribe.org](mailto:support@palascribe.org)

---

**Made with ❤️ for the preservation and accessibility of dharma teachings**
