# PALAScribe: Advanced Audio Transcription for Pali & Dharma Content

## Overview

PALAScribe is a specialized audio transcription application designed specifically for transcribing Pali teachings, dharma talks, and Buddhist educational content. Built with modern web technologies and powered by OpenAI's Whisper AI, PALAScribe provides high-quality automated transcription with intelligent post-processing tailored for spiritual and educational content.

The application streamlines the workflow from audio upload to final document delivery, featuring an intuitive rich-text editor, intelligent paragraph formatting, and specialized Pali term highlighting to ensure accurate and professional transcription outputs.

## Key Features

### 🎯 **Core Transcription Capabilities**
- **AI-Powered Transcription**: Leverages OpenAI Whisper for state-of-the-art speech recognition
- **Multiple Audio Formats**: Supports MP3, WAV, M4A, and other common audio formats
- **Preview Mode**: Quick 30-second preview transcription for testing and validation
- **Large File Support**: Handles extended audio files with progress tracking and time estimation

### 📝 **Advanced Text Processing**
- **Rich Text Editor**: Full-featured WYSIWYG editor with formatting tools
- **Automatic Paragraph Formatting**: Intelligent paragraph breaks based on speech patterns and discourse markers
- **Pali Term Highlighting**: Automatic detection and highlighting of Pali/Sanskrit terminology
- **Real-time Preview**: Live preview pane showing formatted output as you edit

### 🔄 **Workflow Management**
- **Project-Based Organization**: Manage multiple transcription projects with status tracking
- **Draft Saving**: Automatically save work in progress with version control
- **Status Pipeline**: Track projects through New → Processing → Needs Review → Approved workflow
- **Bulk Operations**: Clear completed projects and manage workflow efficiently

### 📊 **User Interface & Experience**
- **Responsive Design**: Works seamlessly on desktop and tablet devices
- **Progress Tracking**: Real-time progress indicators with time estimates
- **Notification System**: Contextual feedback and error handling
- **Keyboard Shortcuts**: Audio playback controls (spacebar, arrow keys) for efficient editing

### 📄 **Export & Delivery**
- **PDF Export**: Generate professional PDF documents with project metadata
- **Text Download**: Plain text export for further processing
- **Formatted Output**: Maintains formatting and Pali highlighting in exports

## High-Level Technical Architecture

### **Frontend Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                     PALAScribe Frontend                     │
├─────────────────────────────────────────────────────────────┤
│  HTML5 Application (index-server.html)                     │
│  ├── Rich Text Editor (ContentEditable + Toolbar)          │
│  ├── Audio Player Integration                              │
│  ├── Project Dashboard (Table View + Search)               │
│  └── Notification System                                   │
├─────────────────────────────────────────────────────────────┤
│  JavaScript Modules                                        │
│  ├── UIController (ui-controller-fixed.js)                 │
│  ├── ProjectManager (project-manager-server.js)            │
│  ├── Configuration (config.js)                             │
│  └── Utilities (utils.js)                                  │
├─────────────────────────────────────────────────────────────┤
│  Styling Framework                                         │
│  ├── Tailwind CSS (Responsive Design)                      │
│  ├── Custom Components                                     │
│  └── Animation & Transitions                               │
└─────────────────────────────────────────────────────────────┘
```

### **Backend Services**
```
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services                         │
├─────────────────────────────────────────────────────────────┤
│  Python Flask Server (palascribe_server.py)                │
│  ├── Project Management API                                │
│  ├── File Upload Handler                                   │
│  ├── SQLite Database Integration                           │
│  └── Audio Processing Pipeline                             │
├─────────────────────────────────────────────────────────────┤
│  Whisper AI Integration                                    │
│  ├── Local Whisper Server (whisper_server.py)             │
│  ├── Audio Format Conversion                               │
│  ├── Transcription Processing                              │
│  └── Progress Tracking                                     │
├─────────────────────────────────────────────────────────────┤
│  Data Storage                                              │
│  ├── SQLite Database (palascribe.db)                       │
│  ├── Audio File Storage (/uploads)                         │
│  ├── Project Metadata                                      │
│  └── Transcription Cache                                   │
└─────────────────────────────────────────────────────────────┘
```

### **Data Flow Architecture**
```
Audio Upload → File Validation → Whisper Processing → 
Text Formatting → Pali Highlighting → Rich Text Editor → 
Draft Saving → Review Process → Final Approval → PDF Export
```

### **Technology Stack**
- **Frontend**: HTML5, JavaScript ES6+, Tailwind CSS
- **Backend**: Python Flask, SQLite
- **AI Engine**: OpenAI Whisper (Local/Remote)
- **Audio Processing**: FFmpeg, Python audio libraries
- **Database**: SQLite with JSON field support
- **File Storage**: Local filesystem with organized structure

### **Key Architectural Decisions**
1. **Client-Server Architecture**: Separates UI logic from transcription processing
2. **Progressive Enhancement**: Core functionality works without advanced features
3. **Modular JavaScript**: Organized into logical modules for maintainability
4. **SQLite Database**: Lightweight, serverless database for project management
5. **Local Whisper Option**: Can run entirely offline for privacy and speed

## Current Feature Highlights

### **Intelligent Text Processing**
- **Discourse Marker Recognition**: Automatically detects transitions ("Well", "So", "However", "In conclusion")
- **Speech Pattern Analysis**: Creates paragraph breaks based on natural speech patterns
- **Question Detection**: Separates questions from statements for better readability
- **Length-Based Paragraphing**: Ensures optimal paragraph length (max 400 characters, 5 sentences)

### **Pali Language Support**
- **Diacritic Recognition**: Identifies words with Pali diacritics (ā, ī, ū, ṅ, ñ, etc.)
- **Common Term Detection**: Recognizes standard Pali terms (dhamma, sangha, buddha, etc.)
- **Visual Highlighting**: Uses distinctive styling for identified Pali content
- **Preservation in Export**: Maintains highlighting in PDF and formatted exports

### **User Experience Enhancements**
- **Audio Keyboard Controls**: Spacebar (play/pause), arrows (skip ±10 seconds)
- **Auto-Save Functionality**: Prevents data loss during long editing sessions
- **Progress Indicators**: Visual feedback for transcription processing
- **Error Recovery**: Graceful handling of processing failures with user guidance

## Future Development Backlog

### **Phase 1: Scalability & Performance**
1. **Support Large Files and Timeouts**
   - Implement chunked audio processing for files >100MB
   - Add resume capability for interrupted transcriptions
   - Optimize memory usage for extended audio processing
   - Implement background processing queue system

2. **Testing with 15-20 Audio Files and Refinement**
   - Systematic testing across various audio qualities and speakers
   - Fine-tune transcription accuracy parameters
   - Develop audio quality assessment and preprocessing
   - Create automated testing suite for regression testing

### **Phase 2: Enhanced Language Processing**
3. **Optimizing English→Pali Dictionary**
   - Expand Pali term database with phonetic variations
   - Implement context-aware term recognition
   - Add support for Sanskrit terminology
   - Develop user-customizable term dictionaries

### **Phase 3: Authentication & Multi-User Support**
4. **Add Support for Google Authentication**
   - Implement OAuth 2.0 integration with Google
   - Add user profile management
   - Enable project sharing and collaboration
   - Implement role-based access control (admin, editor, viewer)

### **Phase 4: Production Deployment**
5. **Fix All UI and UX Issues**
   - Comprehensive accessibility audit (WCAG 2.1 compliance)
   - Mobile responsiveness optimization
   - Performance optimization for large project lists
   - User experience testing and refinement

6. **Deploy Server into Large Machine for Multi-User Access**
   - Containerize application with Docker
   - Set up cloud infrastructure (AWS/GCP/Azure)
   - Implement load balancing and auto-scaling
   - Add monitoring, logging, and backup systems
   - Establish CI/CD pipeline for continuous deployment

### **Future Vision**
- **Real-time Collaboration**: Multiple users editing the same transcription
- **Advanced AI Features**: Speaker identification, emotion detection
- **Integration Ecosystem**: APIs for third-party integrations
- **Mobile Applications**: Native iOS/Android apps
- **Advanced Analytics**: Usage statistics and transcription quality metrics

---

*PALAScribe represents a specialized solution for the unique needs of dharma content transcription, combining cutting-edge AI technology with deep understanding of Buddhist educational workflows.*
