# PALAScribe Demo Video Script
*Complete Video Production Guide*

## 📹 Video Overview

**Total Duration**: 5-6 minutes
**Target Audience**: VRI centers, publishers, researchers, practitioners
**Goal**: Showcase PALAScribe's unique features and professional capabilities
**Format**: Screen recording with voiceover

---

## 🎬 Pre-Production Setup

### **Required Materials**
1. **Sample Audio Files**:
   - `dharma_talk_sample.mp3` (2-3 minutes, contains Pali terms)
   - `meditation_session.wav` (1 minute excerpt)
   - `buddhist_teaching.m4a` (contains: buddha, dharma, samadhi, panya terms)

2. **Screen Recording Software**:
   - OBS Studio (recommended)
   - QuickTime (macOS)
   - Camtasia (professional)

3. **Audio Setup**:
   - Clear microphone
   - Quiet recording environment
   - Professional tone

### **Technical Preparation**
```bash
# Start PALAScribe server
cd /path/to/audio-text-converter
python3 whisper_server.py

# Verify server running on http://localhost:8765
# Open index.html in browser
# Test with sample file first
```

---

## 🎯 Scene-by-Scene Script

### **SCENE 1: Opening & Introduction (0:00 - 0:45)**

**Visual**: PALAScribe interface, clean desktop
**Voiceover**:
> "Welcome to PALAScribe - the most advanced audio transcription solution designed specifically for VRI content. Unlike generic transcription tools, PALAScribe combines OpenAI's cutting-edge Whisper technology with intelligent Pali language correction, making it perfect for dharma talks, meditation sessions, and Buddhist teachings."

**Screen Actions**:
- Show clean PALAScribe interface
- Highlight the professional design
- Show "PALAScribe" branding clearly
- Pan across the main features

**Key Points to Emphasize**:
- VRI-specific solution
- Professional quality
- Intelligent correction

---

### **SCENE 2: File Upload Demo (0:45 - 1:15)**

**Visual**: File upload area, drag-and-drop demo
**Voiceover**:
> "Getting started is incredibly simple. Just drag and drop your audio file, or click to browse. PALAScribe supports all major formats - MP3, WAV, M4A, FLAC, and OGG files up to 500MB."

**Screen Actions**:
- Show empty upload area
- Drag a file from desktop
- Show file validation success
- Display file information (name, size, format)
- Show format compatibility icons

**Technical Details**:
- Use a 30-60MB sample file
- Show the file size and format detection
- Demonstrate the progress indicator

---

### **SCENE 3: Processing Options (1:15 - 1:45)**

**Visual**: Model selection, language options, preview toggle
**Voiceover**:
> "Choose your processing options. The Medium model offers the best balance of speed and accuracy. For quick testing, enable Preview Mode to transcribe just the first 60 seconds. Perfect for checking quality before processing longer files."

**Screen Actions**:
- Show model dropdown (Base, Small, Medium, Large)
- Select "Medium" model
- Toggle Preview Mode ON
- Show preview duration setting (60 seconds)
- Click "Start Transcription"

**Highlight**:
- Medium model recommendation
- Preview mode benefits
- Time estimation

---

### **SCENE 4: Live Processing (1:45 - 2:45)**

**Visual**: Processing screen, progress indicators, server logs (split screen)
**Voiceover**:
> "Watch PALAScribe in action. The progress indicator shows real-time updates, and you can see the estimated completion time. Behind the scenes, our server is preprocessing the audio, running Whisper transcription, and preparing for intelligent Pali corrections."

**Screen Actions**:
- Show processing animation
- Display progress percentage
- Show estimated time countdown
- Split screen showing server terminal logs
- Highlight key log messages:
  - "Audio processing request received"
  - "Whisper processing completed"
  - "Applying Pali corrections"

**Terminal Logs to Show**:
```
🎵 Audio processing request received
🔍 Preview mode enabled - processing first 60 seconds
🚀 Executing command: whisper-env/bin/whisper...
✅ Whisper processing completed in 45.2 seconds
🔍 Applying Pali corrections to extracted transcription...
```

---

### **SCENE 5: Pali Corrections Showcase (2:45 - 3:30)**

**Visual**: Before/after comparison, correction logs
**Voiceover**:
> "Here's where PALAScribe truly shines. Watch as it automatically corrects Buddhist terminology. 'Samadhi' becomes 'Samādhi' with proper diacritics. 'Panya' is corrected to 'Paññā'. 'Dharma' becomes 'Dhamma'. Our system recognizes over 150 Buddhist terms and their phonetic variations."

**Screen Actions**:
- Show transcription result appearing
- Highlight specific corrections with callouts:
  - "samadhi" → "Samādhi" (highlighted in different color)
  - "panya" → "Paññā" (show before/after)
  - "buddha" → "Buddha" (case correction)
  - "satipatthana" → "Satipaṭṭhāna" (complex diacritics)
- Show server logs of corrections:
```
🎯 Found potential match for 'samadhi' -> 'Samādhi'
📝 Replacing 'samadhi' with 'Samādhi'
✅ Applied 3 Pali corrections:
   • samadhi → Samādhi
   • panya → Paññā
   • buddha → Buddha
```

**Animation Ideas**:
- Before/after text overlay
- Color-coded corrections
- Zoom in on corrected terms

---

### **SCENE 6: Text Editor Features (3:30 - 4:15)**

**Visual**: Rich text editor, formatting toolbar
**Voiceover**:
> "The built-in editor gives you complete control over your transcription. Format text with bold, italic, and underline. Use the format dropdown for consistent styling. Clear unwanted formatting with one click, and use undo-redo for confidence while editing."

**Screen Actions**:
- Select text and apply bold formatting
- Show italic and underline options
- Demonstrate format dropdown menu
- Use "Clear Formatting" button
- Show undo/redo buttons working
- Type additional text to show real-time editing

**Editor Features to Demo**:
- Text selection
- Toolbar responsiveness
- Format preservation
- Multi-level undo

---

### **SCENE 7: Final Results & Export (4:15 - 4:45)**

**Visual**: Completed transcription, copy/save options
**Voiceover**:
> "Your professional-quality transcription is ready. The text maintains perfect formatting, includes proper Pali terminology, and is ready for immediate use. Copy to clipboard, save as a document, or continue editing as needed."

**Screen Actions**:
- Scroll through completed transcription
- Show word count and processing time
- Demonstrate copy functionality
- Show the clean, professional output
- Highlight the quality of Pali corrections in context

**Quality Indicators**:
- Word count display
- Processing time shown
- Professional formatting
- Accurate terminology

---

### **SCENE 8: Use Cases & Closing (4:45 - 5:30)**

**Visual**: Split screen showing various applications
**Voiceover**:
> "PALAScribe is perfect for dharma centers transcribing teachings, publishers creating books, researchers preparing study materials, and practitioners building personal libraries. With its combination of advanced AI and VRI-specific intelligence, PALAScribe delivers transcriptions that truly understand your content."

**Screen Actions**:
- Show multiple browser tabs with different transcriptions
- Display various use case examples:
  - Dharma talk with timestamps
  - Meditation instructions
  - Study materials with formatting
- End with PALAScribe logo and tagline

**Final Message**:
> "PALAScribe - Transforming VRI audio into accurate, professionally formatted text."

---

## 🎤 Voiceover Guidelines

### **Tone & Style**
- **Professional but warm**
- **Clear articulation**
- **Measured pace** (not rushed)
- **Confident delivery**
- **Emphasize key benefits**

### **Technical Terms Pronunciation**
- **PALAScribe**: "PALA-Scribe" (emphasis on PALA)
- **Whisper**: Standard pronunciation
- **Samādhi**: "Sa-MAH-dhee" (show diacritics)
- **Paññā**: "Pan-NYA" (nasalized n)
- **Satipaṭṭhāna**: "Sa-ti-pat-TA-na"

### **Key Phrases to Emphasize**
- "VRI-specific solution"
- "Intelligent Pali correction"
- "Professional quality"
- "150+ Buddhist terms"
- "Perfect for dharma centers"

---

## 🎥 Production Notes

### **Recording Settings**
- **Resolution**: 1920x1080 minimum
- **Frame Rate**: 30fps
- **Audio**: 44.1kHz, 16-bit minimum
- **Format**: MP4 for compatibility

### **Visual Guidelines**
- **Cursor**: Large, visible cursor
- **Zoom**: Zoom in on important UI elements
- **Timing**: Allow 2-3 seconds for viewers to read text
- **Transitions**: Smooth, professional transitions

### **Post-Production**
- **Color Correction**: Ensure UI colors are accurate
- **Audio Sync**: Perfect voiceover synchronization
- **Captions**: Add professional captions
- **Branding**: Include logo in corner throughout

### **Export Specifications**
- **Primary**: MP4, H.264, 1080p
- **Web**: Additional 720p version
- **Thumbnails**: Create engaging thumbnail images
- **Chapters**: Add video chapters for easy navigation

---

## 📊 Success Metrics

### **Viewer Engagement Targets**
- **Completion Rate**: 80%+ watch to end
- **Key Moments**: Pali corrections (highest interest)
- **Replay Sections**: Processing demo
- **Share Rate**: Professional appearance encourages sharing

### **Call-to-Action Points**
1. **After Processing Demo**: "See how easy it is?"
2. **After Pali Corrections**: "No other tool does this"
3. **Final Frame**: Contact information for trials

---

## 🔄 Version Control

### **Video Versions**
- **Full Demo**: 5-6 minutes (complete feature set)
- **Quick Intro**: 2-3 minutes (key features only)
- **Technical Deep Dive**: 8-10 minutes (for developers)
- **Use Case Specific**: Separate videos for different audiences

### **Localization**
- **Subtitles**: English, other languages as needed
- **Voiceover**: Multiple language versions
- **UI Language**: Show multilingual capabilities

---

*This script ensures a professional, comprehensive demo that showcases PALAScribe's unique value proposition in the VRI transcription market.*
