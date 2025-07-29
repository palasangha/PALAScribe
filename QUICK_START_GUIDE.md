# 🚀 PALAScribe Quick Start Guide

*Get up and running with PALAScribe in under 5 minutes!*

## Prerequisites Check ✅

Before starting, ensure you have:

- [ ] Python 3.8 or higher installed
- [ ] FFmpeg installed (for audio processing)
- [ ] Git installed (to clone the repository)
- [ ] A web browser (Chrome, Firefox, Safari, or Edge)

## 1. Installation (2 minutes)

### Option A: Automatic Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/palasangha/PALAScribe.git
cd PALAScribe

# Run the automatic setup script
chmod +x whisper-setup-guide.sh
./whisper-setup-guide.sh
```

### Option B: Manual Setup

```bash
# Clone and enter directory
git clone https://github.com/palasangha/PALAScribe.git
cd PALAScribe

# Create virtual environment
python3 -m venv whisper-env
source whisper-env/bin/activate  # On Windows: whisper-env\Scripts\activate

# Install dependencies
pip install openai-whisper torch flask flask-cors python-docx
```

## 2. Start the Application (1 minute)

### Start the Backend Server

```bash
# Activate environment (if not already active)
source whisper-env/bin/activate

# Start the Whisper server
python whisper_server.py
```

*The server will start on <http://localhost:8765>*

### Open the Frontend

1. Open a new terminal/command prompt
2. Navigate to the project directory
3. Open `index.html` in your web browser:

   ```bash
   # macOS
   open index.html
   
   # Windows
   start index.html
   
   # Linux
   xdg-open index.html
   ```

## 3. Test with Sample Audio (2 minutes)

### Quick Test

1. Click **"Start New Project"** on the dashboard
2. Upload a short audio file (30 seconds recommended for first test)
3. Wait for transcription to complete
4. Review the results with automatic Pali corrections

### Sample Audio Suggestions

- Record yourself saying: *"Buddha taught the Dharma with great Panya"*
- Expected output: *"Buddha taught the Dhamma with great Paññā"*

## 4. Verify Everything Works

### ✅ Success Indicators

- [ ] Backend server starts without errors
- [ ] Frontend loads in browser
- [ ] File upload works
- [ ] Transcription completes successfully
- [ ] Pali corrections are applied
- [ ] Documents can be downloaded

## 🛠️ Troubleshooting

### Server Won't Start

```bash
# Check Python version
python3 --version

# Reinstall dependencies
pip install --upgrade openai-whisper torch
```

### Frontend Issues

- Clear browser cache
- Try a different browser
- Check browser console for errors (F12)

### Audio Upload Fails

- Ensure file is under 25MB
- Supported formats: MP3, WAV, M4A, FLAC, OGG
- Try a shorter audio file first

## 🎯 Next Steps

Once everything is working:

1. **Read the Full Documentation**: Check `README.md` for detailed features
2. **Explore Advanced Features**: Preview mode, project management, bulk processing
3. **Review Technical Docs**: `TECHNICAL_ARCHITECTURE.md` for system details
4. **Watch Demo**: Follow `VIDEO_SCRIPT.md` for feature walkthrough

## 📞 Getting Help

- **Issues**: Open a GitHub issue with error details
- **Questions**: Check `README.md` troubleshooting section
- **Features**: Review `DEMO_DOCUMENTATION.md` for complete capabilities

---

*Total setup time: ~5 minutes | First transcription: ~30 seconds*

**Happy transcribing with PALAScribe! 🎵📝**
