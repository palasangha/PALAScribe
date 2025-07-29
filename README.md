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

📊 **Multi-User Project Management**
- Create and manage transcription projects with database persistence
- Track project status through workflow stages
- Search and filter projects
- User isolation and data persistence across server restarts

📄 **Document Generation**
- Generate DOCX files from transcriptions
- Download generated documents
- Upload reviewed documents
- Complete review workflow

🏗️ **Consolidated Architecture**
- Single server handles all functionality (transcription + project management)
- SQLite database for data persistence
- RESTful API for all operations
- No port conflicts or multiple server management

## Quick Start

### Prerequisites

Before using PALAScribe, you need to set up local Whisper. Follow the setup guide below.

### 1. Install Local Whisper

**Option A: Automatic Setup (Recommended)**
```bash
# Run the setup script (macOS/Linux)
chmod +x whisper-setup-guide.sh
./whisper-setup-guide.sh

# For Windows, see manual setup below
```

**Option B: Manual Setup**

1. **Install Python 3.8+**
   ```bash
   # Check Python version
   python --version
   # Should be 3.8 or higher
   ```

2. **Install Whisper**
   ```bash
   # Install using pip
   pip install openai-whisper

   # Or install with additional dependencies
   pip install openai-whisper[all]
   ```

3. **Install FFmpeg** (required for audio processing)
   
   **macOS (using Homebrew):**
   ```bash
   brew install ffmpeg
   ```
   
   **Ubuntu/Debian:**
   ```bash
   sudo apt update
   sudo apt install ffmpeg
   ```
   
   **Windows:**
   - Download from [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)
   - Add to system PATH

4. **Test Whisper Installation**
   ```bash
   # Test with a simple command
   whisper --help
   
   # Download a model (optional - will download on first use)
   whisper --model medium --language English test-audio.wav
   ```

### 2. Start the PALAScribe Server

1. **Start the consolidated server**
   ```bash
   # Option 1: Use the provided script (recommended)
   ./start-palascribe.sh
   
   # Option 2: Start manually
   python3 palascribe_server.py
   ```

2. **Verify the server is running**
   - Server should start on `http://localhost:8765`
   - All services (transcription + project management) run on this single port
   - Check browser console or visit the URL to confirm

### 3. Open PALAScribe Application

1. **Launch the application**
   - Open `index.html` in a modern web browser
   - Or use the launcher: open `launcher.html` for auto-backend startup

2. **Create Your First Project**
   - Click "Start Audio Conversion"
   - Enter a project name
   - Optionally assign to a reviewer
   - Upload your audio file

3. **Convert Audio**
   - Choose preview mode for large files (processes first 60 seconds)
   - Click "Create Project" to start transcription
   - Monitor progress in the notification area

4. **Review and Approve**
   - Navigate to "Ready for Review" to see completed transcriptions
   - Edit and format the text using the rich text editor
   - Use "Approve Final" to mark as complete
   - Download the final transcription

## Project Status Workflow

PALAScribe uses a streamlined status-based workflow:

```
NEW → PROCESSING → NEEDS_REVIEW → APPROVED
```

- **NEW**: Project created, ready for audio upload
- **PROCESSING**: Audio being transcribed by local Whisper
- **NEEDS_REVIEW**: Transcription complete, ready for review and editing
- **APPROVED**: Final transcription approved and downloadable

## Local Whisper Configuration

### Whisper Models

PALAScribe uses the `medium` model by default for balanced accuracy and speed:

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

### Preview Mode

For large audio files, use preview mode:
- Processes only the first 60 seconds
- Faster processing and preview
- Useful for testing and quick review
- Enable via checkbox in project creation

## Supported File Formats

- **MP3** (.mp3) - Most common format
- **WAV** (.wav) - High quality, uncompressed
- **M4A** (.m4a) - Apple format
- **FLAC** (.flac) - Lossless compression
- **OGG** (.ogg) - Open source format

Maximum recommended file size: 100MB (configurable in backend)
For larger files, use preview mode or split into smaller segments.

## Pali Dictionary

The application includes a comprehensive Pali dictionary with:

- **Core Buddhist concepts**: dukkha, nibbana, dhamma, sangha
- **Meditation terms**: vipassana, samatha, jhana, mindfulness
- **Philosophical terms**: anicca, anatta, sunyata
- **Ethical concepts**: sila, ahimsa, metta, karuna
- **Text references**: dhammapada, vinaya, sutta, abhidhamma

Recognized Pali words are automatically highlighted in the transcription.

## Keyboard Shortcuts

- **Ctrl+N** (Cmd+N): Create new project
- **Ctrl+S** (Cmd+S): Save draft in editor
- **Escape**: Close modals

## Browser Compatibility

Requires a modern browser with support for:

- ES6+ JavaScript features
- Fetch API
- Local Storage
- File API
- Blob/URL APIs

Tested on:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## File Structure

```text
audio-text-converter/
├── index.html                   # Main application page
├── launcher.html               # Auto-starting launcher
├── start-whisper-server.sh     # Server startup script
├── whisper-setup-guide.sh      # Whisper installation script
├── whisper_server.py           # Local Whisper backend server
├── css/
│   └── styles.css              # Custom styles (Tailwind CSS)
├── js/
│   ├── config.js               # Configuration and constants
│   ├── pali-dictionary.js      # Pali word dictionary and processor
│   ├── audio-processor.js      # Audio transcription handling
│   ├── project-manager.js      # Project data management
│   ├── ui-controller-fixed.js  # User interface controller
│   └── app.js                  # Main application entry point
└── data/                       # Data storage directory (created automatically)
```

## Data Storage

- **Local Storage**: Projects, settings stored in browser
- **Memory**: Audio files and generated documents (temporary)
- **Downloads**: Generated transcription files

⚠️ **Note**: Data is stored locally in the browser. Clearing browser data will reset the application.

## Backend API Integration

### Local Whisper Server

PALAScribe communicates with a local Python backend running Whisper:

```javascript
// Example API call to local server
const formData = new FormData();
formData.append('audio', audioFile);
formData.append('model', 'medium');
formData.append('language', 'English');
formData.append('preview', 'false');

fetch('http://localhost:8765/process', {
    method: 'POST',
    body: formData
});
```

### Server Endpoints

- **POST /process**: Transcribe audio file
- **GET /status**: Check server health
- **GET /models**: List available Whisper models

### Mock API (Demo Mode)

When Whisper backend is not available, the app falls back to mock mode:

- Simulates API delay (3 seconds)
- Returns sample transcription with Pali words
- No network requests made
- Perfect for testing and development

## Customization

### Adding Pali Words

```javascript
// Add new words to the dictionary
paliProcessor.addWord('newword', {
    meaning: 'word definition',
    category: 'category',
    pronunciation: 'pronunciation guide'
});
```

### Modifying UI Themes

Edit `css/styles.css` to customize:

- Color schemes
- Typography
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
4. Open `index.html` in a web browser
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
