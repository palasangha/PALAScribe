# PALAScribe Technical Architecture Documentation

*Comprehensive System Architecture and Technical Specifications*

## 📊 System Overview

PALAScribe is a privacy-focused, local audio transcription system designed specifically for VRI (Vipassana Research Institute) content. It combines OpenAI's Whisper AI with intelligent Pali language processing to deliver accurate transcriptions of Buddhist teachings and meditation sessions.

---

## 🏗️ High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PALAScribe System Architecture                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────────┐  │
│  │   Frontend UI   │    │  Local Storage  │    │     Browser Environment     │  │
│  │   (React-like)  │◄──►│   (IndexedDB)   │    │      (Chrome/Firefox)      │  │
│  │                 │    │                 │    │                             │  │
│  │ • Dashboard     │    │ • Projects      │    │ • File API                  │  │
│  │ • Project Mgmt  │    │ • Audio Blobs   │    │ • Fetch API                 │  │
│  │ • Rich Editor   │    │ • Transcripts   │    │ • Web Audio API             │  │
│  │ • Status Views  │    │ • Settings      │    │ • Local Storage             │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────────┘  │
│           │                                                   │                  │
│           │                    HTTP/JSON                      │                  │
│           ▼                                                   ▼                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                          Network Layer                                      │ │
│  │                     (localhost:8765)                                        │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│           │                                                                     │
│           ▼                                                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                              Backend Server                                     │
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────────┐  │
│  │  Flask Server   │    │  Audio Pipeline │    │    Whisper Engine          │  │
│  │                 │    │                 │    │                             │  │
│  │ • /process      │    │ • File Upload   │    │ • Model Loading             │  │
│  │ • /status       │    │ • Format Check  │    │ • Audio Processing          │  │
│  │ • /models       │    │ • Size Validation│   │ • Speech Recognition       │  │
│  │ • Error Handle  │    │ • Preview Mode   │    │ • Timestamp Generation     │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────────┘  │
│           │                       │                           │                  │
│           ▼                       ▼                           ▼                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────────┐  │
│  │ Request Router  │    │ File Processor  │    │    Model Manager            │  │
│  │                 │    │                 │    │                             │  │
│  │ • CORS Handle   │    │ • FFmpeg Prep   │    │ • tiny/base/small/medium    │  │
│  │ • Auth (Future) │    │ • Audio Segment │    │ • Dynamic Loading           │  │
│  │ • Rate Limiting │    │ • Temp Cleanup  │    │ • Memory Management         │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────────┘  │
│           │                       │                           │                  │
│           ▼                       ▼                           ▼                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                        Post-Processing Layer                                │ │
│  │                                                                             │ │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐ │ │
│  │  │ Pali Processor  │    │Text Formatter   │    │   Quality Analyzer      │ │ │
│  │  │                 │    │                 │    │                         │ │ │
│  │  │ • Dictionary    │    │ • Paragraphing  │    │ • Confidence Scores     │ │ │
│  │  │ • Diacritics    │    │ • Punctuation   │    │ • Word Accuracy         │ │ │
│  │  │ • Corrections   │    │ • Speaker Tags  │    │ • Audio Quality Check   │ │ │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────┤
│                              System Layer                                       │
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────────┐  │
│  │ Python Runtime  │    │     FFmpeg      │    │      File System           │  │
│  │                 │    │                 │    │                             │  │
│  │ • Python 3.8+   │    │ • Audio Decode  │    │ • Temp Directory            │  │
│  │ • Virtual Env   │    │ • Format Conv   │    │ • Model Cache               │  │
│  │ • Dependencies  │    │ • Quality Check │    │ • Log Files                 │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Component Architecture

### Frontend Layer (Browser)

#### 1. User Interface Components
```
Dashboard View
├── Project Cards/Table
├── Status Indicators 
├── Search & Filter
└── Navigation Menu

Project Creation Modal
├── File Upload Zone
├── Form Validation
├── Preview Options
└── Progress Tracking

Rich Text Editor
├── Formatting Toolbar
├── Pali Highlighting
├── Word/Character Count
└── Auto-save Feature

Status Views
├── Ready for Review
├── Approved Projects
└── Processing Queue
```

#### 2. Frontend Technology Stack
- **Core**: Vanilla JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **State Management**: Custom Project Manager
- **Storage**: Browser localStorage + IndexedDB
- **File Handling**: File API + Blob URLs

### Backend Layer (Python Server)

#### 1. Server Architecture
```python
Flask Application Structure:
├── app.py (Main Server)
├── routes/
│   ├── process.py (Audio Processing)
│   ├── status.py (Health Checks)
│   └── models.py (Model Management)
├── processors/
│   ├── audio_handler.py
│   ├── whisper_engine.py
│   └── pali_corrector.py
├── utils/
│   ├── file_validator.py
│   ├── temp_manager.py
│   └── logger.py
└── config/
    ├── models.json
    ├── pali_dictionary.json
    └── settings.py
```

#### 2. Processing Pipeline
```
Audio Upload → File Validation → Format Conversion → 
Whisper Processing → Pali Correction → Response Formatting
```

---

## ⚡ Performance Specifications

### Processing Time Analysis

#### Model Performance Comparison
| Model Size | VRAM Usage | CPU Cores | 1min Audio | 10min Audio | 1hr Audio |
|------------|------------|-----------|------------|-------------|------------|
| tiny       | ~1GB       | 2-4       | 5-10s      | 30-60s      | 5-8min     |
| base       | ~1GB       | 2-4       | 8-15s      | 45-90s      | 7-12min    |
| small      | ~2GB       | 4-6       | 12-20s     | 60-120s     | 10-18min   |
| medium     | ~5GB       | 6-8       | 15-30s     | 90-180s     | 15-25min   |
| large      | ~10GB      | 8+        | 20-40s     | 120-240s    | 20-35min   |

#### Processing Speed Factors
1. **Hardware Impact**:
   - CPU: Intel i7/AMD Ryzen 7+ recommended
   - RAM: 16GB minimum, 32GB recommended
   - Storage: SSD for temp files
   - GPU: Optional but improves large model performance

2. **Audio Quality Impact**:
   - Sample Rate: 16kHz optimal for Whisper
   - Bit Rate: 128kbps+ recommended
   - Format: WAV/FLAC for best accuracy
   - Background Noise: Significantly affects processing time

3. **File Size Recommendations**:
   - **Optimal**: 10-50MB (10-30 minutes)
   - **Good**: 50-100MB (30-60 minutes)
   - **Acceptable**: 100-500MB (1-3 hours)
   - **Use Preview Mode**: >500MB

---

## 🔄 Data Flow Architecture

### 1. Project Creation Flow
```
User Input → Form Validation → Project Creation → 
Audio Upload → Backend Processing → Status Updates → 
Completion Notification → Review Ready
```

### 2. Audio Processing Flow
```
File Upload (Frontend)
    ↓
Size/Format Validation (Frontend)
    ↓
HTTP POST to /process (Network)
    ↓
File Reception (Backend)
    ↓
Audio Preprocessing (FFmpeg)
    ↓
Whisper Model Loading (If needed)
    ↓
Speech Recognition (Whisper)
    ↓
Pali Dictionary Correction
    ↓
Text Formatting & Enhancement
    ↓
JSON Response Assembly
    ↓
HTTP Response (Network)
    ↓
Project Update (Frontend)
    ↓
Status Change to NEEDS_REVIEW
```

### 3. Review & Approval Flow
```
Project Selection → Content Loading → 
Text Editing → Auto-save → Final Approval → 
Status Change to APPROVED → Download Option
```

---

## 🛠️ System Requirements

### Minimum Requirements
- **OS**: macOS 10.14+, Windows 10+, Ubuntu 18.04+
- **RAM**: 8GB (for small model)
- **Storage**: 5GB free space
- **CPU**: Dual-core 2.5GHz
- **Browser**: Chrome 80+, Firefox 80+, Safari 13+
- **Python**: 3.8+
- **Network**: None (fully local)

### Recommended Requirements
- **OS**: macOS 12+, Windows 11+, Ubuntu 20.04+
- **RAM**: 16GB (for medium model)
- **Storage**: 20GB free space (for model cache)
- **CPU**: Quad-core 3.0GHz+ (Intel i7/AMD Ryzen 7)
- **GPU**: 8GB VRAM (for large model, optional)
- **Browser**: Latest Chrome/Firefox
- **Python**: 3.10+

### Professional Requirements
- **RAM**: 32GB+ (for large model + multitasking)
- **Storage**: 50GB+ SSD
- **CPU**: 8+ cores, 3.5GHz+
- **GPU**: RTX 3080/4080 or Apple M1 Pro/Max
- **Network**: Isolated environment capability

---

## 🔒 Security Architecture

### Data Privacy
- **Zero Cloud Dependency**: All processing local
- **No Data Transmission**: Audio never leaves device
- **Temporary File Cleanup**: Auto-deletion after processing
- **Browser Isolation**: Sandboxed execution environment

### Security Measures
```
Input Validation
├── File Type Checking
├── Size Limitations
├── Malware Scanning (Future)
└── Content Filtering

Process Isolation
├── Python Virtual Environment
├── Temp Directory Isolation
├── Process Sandboxing
└── Resource Limits

Data Protection
├── Encrypted Storage (Future)
├── Secure File Deletion
├── Access Control (Future)
└── Audit Logging
```

---

## 📈 Scalability Considerations

### Horizontal Scaling
- **Multi-Instance**: Run multiple Whisper servers
- **Load Balancing**: Distribute requests across instances
- **Queue Management**: Handle concurrent processing
- **Resource Pools**: Dedicated processing nodes

### Vertical Scaling
- **Memory Expansion**: Support larger models
- **CPU Optimization**: Multi-threading improvements
- **GPU Acceleration**: CUDA/Metal support
- **Storage Optimization**: Faster I/O operations

---

## 🔧 Configuration Management

### Frontend Configuration (`js/config.js`)
```javascript
CONFIG = {
    API: {
        BASE_URL: 'http://localhost:8765',
        TIMEOUT: 300000, // 5 minutes
        RETRY_ATTEMPTS: 3
    },
    PROCESSING: {
        MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
        SUPPORTED_FORMATS: ['mp3', 'wav', 'm4a', 'flac', 'ogg'],
        PREVIEW_DURATION: 60, // seconds
        AUTO_SAVE_INTERVAL: 30000 // 30 seconds
    },
    UI: {
        NOTIFICATION_DURATION: 5000,
        DEBOUNCE_DELAY: 300,
        ANIMATION_DURATION: 200
    }
}
```

### Backend Configuration (`whisper_server.py`)
```python
CONFIG = {
    'server': {
        'host': 'localhost',
        'port': 8765,
        'debug': False
    },
    'whisper': {
        'model': 'medium',
        'language': 'English',
        'device': 'auto'  # 'cpu', 'cuda', 'auto'
    },
    'processing': {
        'max_file_size': 100 * 1024 * 1024,
        'temp_dir': './temp',
        'cleanup_after': 3600  # 1 hour
    }
}
```

---

## 🧪 Testing Architecture

### Frontend Testing
- **Unit Tests**: Component functionality
- **Integration Tests**: API communication
- **E2E Tests**: Complete user workflows
- **Performance Tests**: Memory and speed
- **Browser Compatibility**: Cross-browser testing

### Backend Testing
- **API Tests**: Endpoint functionality
- **Audio Processing Tests**: Various file formats
- **Load Tests**: Concurrent request handling
- **Error Handling Tests**: Failure scenarios
- **Integration Tests**: Whisper model integration

---

## 📊 Monitoring & Analytics

### Performance Metrics
```
Processing Metrics:
├── Audio Processing Time
├── Model Loading Time
├── Memory Usage Peak
├── CPU Utilization
├── File Size vs Time Correlation
└── Error Rates by File Type

User Experience Metrics:
├── Session Duration
├── Project Completion Rate
├── Feature Usage Statistics
├── Error Frequency
└── User Workflow Patterns
```

### Logging Strategy
- **Frontend**: Console logging with levels
- **Backend**: Structured JSON logging
- **Audit Trail**: User actions and system events
- **Error Tracking**: Detailed error context
- **Performance Logs**: Timing and resource usage

---

## 🚀 Deployment Architecture

### Development Environment
```bash
# Local development setup
git clone <repository>
cd PALAScribe
python -m venv whisper-env
source whisper-env/bin/activate
pip install -r requirements.txt
python whisper_server.py &
open index.html
```

### Production Environment
```bash
# Optimized production deployment
./whisper-setup-guide.sh
./start-whisper-server.sh --production
# Deploy via web server (nginx/apache)
```

### Container Deployment (Future)
```dockerfile
# Docker container for consistent deployment
FROM python:3.10-slim
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . /app
WORKDIR /app
EXPOSE 8765
CMD ["python", "whisper_server.py"]
```

---

## 🔮 Future Enhancements

### Planned Features
1. **Multi-language Support**: Sanskrit, Hindi, Thai
2. **Speaker Diarization**: Multiple speaker identification
3. **Real-time Processing**: Live audio transcription
4. **Cloud Sync**: Optional cloud backup
5. **Collaborative Editing**: Multi-user projects
6. **Advanced Analytics**: Quality metrics dashboard

### Technical Roadmap
- **Q3 2025**: GPU acceleration optimization
- **Q4 2025**: Mobile app development
- **Q1 2026**: Cloud hybrid architecture
- **Q2 2026**: Enterprise features

---

## 📚 API Documentation

### Backend Endpoints

#### POST /process
Process audio file for transcription.

**Request:**
```bash
curl -X POST http://localhost:8765/process \
  -F "audio=@dharma_talk.mp3" \
  -F "model=medium" \
  -F "language=English" \
  -F "preview=false"
```

**Response:**
```json
{
  "success": true,
  "transcription": "Welcome to this dharma talk...",
  "processing_time": 45.2,
  "word_count": 1250,
  "confidence_score": 0.92,
  "preview_mode": false,
  "timestamps": [...],
  "pali_corrections": [
    {"original": "dharma", "corrected": "dhamma"},
    {"original": "samadhi", "corrected": "samādhi"}
  ]
}
```

#### GET /status
Check server health and model status.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": "medium",
  "memory_usage": "45%",
  "uptime": 3600,
  "version": "2.0.0"
}
```

---

This technical architecture provides a comprehensive overview of PALAScribe's system design, performance characteristics, and implementation details. The architecture emphasizes privacy, local processing, and specialized Pali language support while maintaining professional-grade performance and reliability.
