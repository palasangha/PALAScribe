# PALAScribe - Audio-to-Text Converter

A web-based application for converting audio files to text with specialized Pali word recognition, designed for VRI content transcription. Features a consolidated server architecture with multi-user support, database persistence, and local OpenAI Whisper processing.

## Features

🎵 **Audio Transcription**
- Upload audio files (MP3, WAV, M4A, FLAC, OGG)
- Convert to text using local OpenAI Whisper
- Privacy-focused: all processing happens locally
- Support for various file sizes with preview mode for large files

📝 **Pali Word Recognition**
- Automatic detection of Pali Buddhist terms
- Special formatting for recognized words
- Extensive built-in Pali dictionary

- Complete review workflow

- Track project status through workflow stages
- Search and filter projects
- User isolation and data persistence across server restarts

- SQLite database for data persistence
- Generate DOCX files from transcriptions
- Download generated documents
- Upload reviewed documents
- Complete review workflow

## Quick Start

**⚡ TL;DR:** `pip install -r requirements.txt` → `brew install ffmpeg` → `./start-palascribe.sh` → Open `index-server.html`
- RESTful API for all operations
### Step 1: Install Dependencies
   ```
## Quick Start
   sudo apt install python3 python3-pip
**⚡ TL;DR:** `pip install -r requirements.txt` → `brew install ffmpeg` → `./start-palascribe.sh` → Open `index-server.html`
   
### Step 1: Install Dependencies
   - Download from [python.org](https://www.python.org/downloads/)
   - Make sure to check "Add Python to PATH" during installation
   
   **Verify installation:**
   ```bash
   python3 --version
   # Should be 3.8 or higher
   ```

2. **Install Python Dependencies**
   ```bash
   # Make Environment
   python -m venv whisper-env
   source whisper-env/bin/activate

   # Using requirements.txt (recommended)
   pip install -r requirements.txt
   
   # Alternative: Manual installation
   Create and activate a virtual environment first.
   ```
   
3. **Install FFmpeg** (required for audio processing)
   
   **macOS (using Homebrew):**
   ```bash
   brew install ffmpeg

2. **Install Python Dependencies**
   ```
   # Make Environment
   **Ubuntu/Debian:**
   ```bash
   sudo apt update
   sudo apt install ffmpeg
   ```
   
   # Alternative: Manual installation
   pip install openai-whisper
   
   **Windows:**
   - Download from [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)
   - Add to system PATH

4. **Verify Installation**
   ```bash
   # Test Whisper
   whisper --help
   
   # Test FFmpeg
   ffmpeg -version
   ```

### Step 2: Start PALAScribe

1. **Start the server**
   ```bash
   # Using the startup script (recommended)
   ./start-palascribe.sh
   
   # Test Whisper
   - Server starts on `http://localhost:8765`
   
   # Test FFmpeg
   ffmpeg -version

   - Open `index-server.html` in your web browser
### Step 3: Start PALAScribe


2. **Create your first project**
   # Or start manually
   python3 palascribe_server.py
   - Monitor progress in the notification area
   This step is **required** for the server to start and for user login to function.
   - Navigate to **`http://localhost:8765`** in your web browser.
   - Navigate to "Ready for Review" to see completed transcriptions
2. **Verify server is running**
   - Server starts on `http://localhost:8765`

   - Visit `http://localhost:8765/health` to test

### Step 3: Use the Application

1. **Open the web interface**
   - Open `index-server.html` in your web browser
   - Or use `launcher.html` for guided startup

2. **Create your first project**
- **NEEDS_REVIEW**: Transcription complete, ready for review and editing
   - Enter a project name
   - Upload your audio file
   - Click "Create Project" to start transcription
## Local Whisper Configuration
2. **Create Your First Project**
   - Click "Start Audio Conversion"
   - Enter a project name
   - Optionally assign to a reviewer
   - Upload your audio file

3. **Convert Audio**
   - Choose preview mode for large files (processes first 60 seconds)
   - Click "Create Project" to start transcription
   - Monitor progress in the notification area


   - Navigate to "Ready for Review" to see completed transcriptions
   - Edit and format the text using the rich text editor
   - Use "Approve Final" to mark as complete
   - Download the final transcription
- **tiny**: Fastest, least accurate (~1GB VRAM)
- **base**: Fast, decent accuracy (~1GB VRAM)
- **small**: Good balance (~2GB VRAM)
- **medium**: Better accuracy (~5GB VRAM) - **Default**
- **large**: Best accuracy (~10GB VRAM)

### Backend Server Configuration

The Whisper backend (`whisper_server.py`) can be configured:

```python
# Default settings
PORT = 8765
MODEL = "medium"
LANGUAGE = "English"
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
```

### Troubleshooting Whisper Setup

**Common Issues:**

1. **"whisper: command not found"**
   ```bash
   # Reinstall whisper
   pip install --upgrade openai-whisper
   
   # Check PATH
   echo $PATH
   ```

2. **FFmpeg not found**
   ```bash
   # Test FFmpeg
   ffmpeg -version
   
   # Reinstall if needed (macOS)
   brew reinstall ffmpeg
   ```

3. **Server won't start**
   ```bash
   # Check if port is in use
   lsof -i :8765
   
   # Kill existing process if needed
   kill -9 $(lsof -ti:8765)
   ```

4. **Out of memory errors**
   - Use a smaller model (`small` or `base`)
   - Enable preview mode for large files
   - Close other applications
   


## Supported File Formats

- **MP3** (.mp3) - Most common format
- **WAV** (.wav) - High quality, uncompressed
- **M4A** (.m4a) - Apple format

## Keyboard Shortcuts


## File Structure

```text
PALAScribe/
├── index-server.html            # Main application interface
├── palascribe_server.py         # Consolidated backend server
└── sessions/                    # Stored session files (auto-created)
```

## Data Storage

- **Downloads**: Generated transcription files
formData.append('preview', 'false');

});
## Customization

### Adding Pali Words
PALAScribe/
├── index-server.html            # Main application interface
├── palascribe_server.py         # Consolidated backend server
├── palascribe.db                # SQLite database (auto-created)
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variable template
    pronunciation: 'pronunciation guide'
│   └── styles.css               # Custom styles
```
│   └── ui-controller-fixed.js   # Main UI controller
├── uploads/                     # Stored audio files (auto-created)
└── sessions/                    # Stored session files (auto-created)
- Layout spacing
- Component styling

### Configuration Options

Edit `js/config.js` to modify:

- File size limits
- Supported formats
- UI timings
- Error messages
- Backend endpoints

## Troubleshooting

### Backend Issues

1. **Backend server not starting**
   - Check Python installation: `python --version`
   - Verify Whisper installation: `whisper --help`
   - Check port availability: `lsof -i :8765`
   - Kill existing processes: `kill -9 $(lsof -ti:8765)`

2. **Transcription fails**
   - Verify backend server is running on port 8765
   - Check audio file format is supported
   - Monitor server logs in terminal
   - Try with a smaller audio file first

3. **Out of memory errors**
   - Use a smaller Whisper model (`small` or `base`)
   - Enable preview mode for large files
   - Close other memory-intensive applications
   - Consider splitting large files

### Frontend Issues

1. **Audio file won't upload**
   - Check file format is supported
   - Verify file isn't corrupted
   - Try a different audio format
   - Check browser console for errors

2. **Projects not saving**
   - Check browser local storage is enabled
   - Clear browser cache and try again
   - Ensure sufficient storage space
   - Try private/incognito mode

3. **Pali words not highlighted**
   - Words must be in the dictionary
   - Check spelling and diacritics
   - Case-insensitive matching applies
   - Review text in editor view

### Error Messages

- **"Backend server not running"**: Start `whisper_server.py`
- **"Failed to fetch"**: Check server connection and port
- **"Unsupported audio format"**: Use MP3, WAV, M4A, FLAC, or OGG
- **"Processing failed"**: Check server logs and file integrity

## Development

### Local Development

1. Clone or download the project
2. Set up local Whisper backend (see setup instructions)
3. Start the backend server: `python whisper_server.py`
4. Open `index-server.html` in a web browser
5. No build process required for frontend

### Testing

The application includes built-in error handling and logging:

- Check browser console for detailed logs
- Use demo mode for testing without backend
- Test with various audio file formats and sizes
- Monitor backend server logs

### Contributing

1. Test your changes thoroughly
2. Ensure browser compatibility
3. Update documentation if needed
4. Follow existing code style
5. Test both frontend and backend integration

## Security Considerations

- **Local Processing**: All audio processing happens locally for privacy
- **File Uploads**: Validate file types and sizes on both frontend and backend
- **Data Storage**: Consider encryption for sensitive projects
- **Network Requests**: Backend runs on localhost only
- **Content Security**: Sanitize user input and file content

## Performance Tips

- **Large Files**: Use preview mode for files over 50MB
- **Memory Usage**: Application cleans up resources automatically
- **Storage**: Regularly export and clear old projects
- **Processing**: Use appropriate Whisper model for your hardware
- **Network**: Backend processing eliminates network dependency

## License

This project is provided as-is for educational and development purposes.

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review browser console for errors
3. Check backend server logs
4. Ensure all requirements are met
5. Test in demo mode first

---

**Version**: 2.0.0  
**Last Updated**: July 2025  
**Compatibility**: Modern browsers with ES6+ support, Python 3.8+, Local Whisper
