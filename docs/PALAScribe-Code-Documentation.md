# PALAScribe Code Structure & Module Documentation

## Project Overview

PALAScribe is built as a modern web application using a client-server architecture with Python Flask backend and vanilla JavaScript frontend. The codebase is organized into logical modules that handle specific aspects of the transcription workflow, from audio processing to user interface management.

## Directory Structure

```
audio-text-converter/
├── Frontend (Client-Side)
│   ├── index-server.html          # Main application interface
│   ├── js/                        # JavaScript modules
│   │   ├── ui-controller-fixed.js # Main UI controller
│   │   ├── project-manager-server.js # Project management
│   │   ├── config.js              # Configuration settings
│   │   └── utils.js               # Utility functions
│   └── css/                       # Styling (embedded in HTML)
├── Backend (Server-Side)
│   ├── palascribe_server.py       # Main Flask server
│   ├── whisper_server.py          # Whisper AI integration
│   └── palascribe.db              # SQLite database
├── Configuration & Scripts
│   ├── start-palascribe.sh        # Application launcher
│   ├── start-whisper-server.sh    # Whisper server launcher
│   └── auto-whisper.sh            # Automatic Whisper setup
└── Storage
    └── uploads/                   # Audio file storage
```

## Core Module Documentation

### 1. Frontend Architecture

#### **index-server.html** - Main Application Interface
**Purpose**: Single-page application that provides the complete user interface for PALAScribe.

**Key Sections**:
```html
<!-- Navigation & Header -->
<header class="bg-white shadow-sm border-b">
  <!-- Project status, backend status, navigation tabs -->

<!-- Dashboard View -->
<div id="dashboard-view">
  <!-- Project creation, project table, search functionality -->

<!-- Review/Edit View -->
<div id="review-view">
  <!-- Rich text editor, audio player, preview pane -->

<!-- Modal Systems -->
<!-- New project modal, transcription progress, notifications -->
```

**Features Implemented**:
- **Responsive Grid Layout**: Uses CSS Grid and Flexbox for optimal layout
- **Rich Text Editor Toolbar**: Complete formatting tools (bold, italic, lists, etc.)
- **Audio Player Integration**: HTML5 audio with keyboard shortcuts
- **Progress Modals**: Real-time transcription progress with time estimates
- **Notification System**: Toast notifications for user feedback
- **Dynamic Content Loading**: JavaScript-driven view switching

**Styling Framework**: 
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Custom Components**: Specialized styling for transcription-specific elements
- **Responsive Design**: Mobile-first approach with breakpoint management

---

### 2. JavaScript Module System

#### **ui-controller-fixed.js** - Primary Application Controller
**Lines of Code**: ~2,700+ lines
**Purpose**: Central hub for all user interface logic and application state management.

**Core Classes & Methods**:

##### **UIController Class**
```javascript
class UIController {
    constructor() {
        this.elements = {};           // DOM element references
        this.currentProject = null;   // Active project state
        this.projectManager = null;   // Project management instance
        this.isProcessing = false;    // Processing state flag
    }
}
```

**Key Method Categories**:

1. **Initialization Methods**
   ```javascript
   async initialize()                    // App startup
   initializeElements()                  // DOM element binding
   initializeEventListeners()            // Event handler setup
   initializeRichTextEditor()            // Editor configuration
   ```

2. **Project Management**
   ```javascript
   async createProject(formData)         // New project creation
   async openProject(projectId)          // Load project for editing
   async deleteProject(projectId)        // Project removal
   refreshProjectsList()                 // Update project display
   ```

3. **Audio Processing**
   ```javascript
   async processProjectAudio()           // Main transcription workflow
   async processWithWhisperBackend()     // Whisper AI integration
   showTranscriptionProgressModal()      // Progress tracking UI
   cancelCurrentProcessing()             // Abort transcription
   ```

4. **Text Processing & Formatting**
   ```javascript
   formatTranscriptionText(text)         // Apply initial formatting
   addAutomaticParagraphs(text)          // Intelligent paragraphing
   highlightPaliTerms(text)              // Pali term detection
   applyAutoParagraphing()               // Manual paragraph formatting
   ```

5. **Rich Text Editor Management**
   ```javascript
   executeCommand(command, value)        // Editor command execution
   setRichTextContent(content, hasHTML)  // Content loading
   getRichTextContent(asPlainText)       // Content extraction
   updateTranscriptionPreview()          // Live preview updates
   ```

6. **User Interface Controls**
   ```javascript
   showView(viewName)                    // View navigation
   showNotification(message, type)       // User feedback
   updateWordCount()                     // Text statistics
   setupAudioKeyboardShortcuts()        // Keyboard controls
   ```

7. **Export & Save Operations**
   ```javascript
   async saveDraft()                     // Save work in progress
   async approveFinal()                  // Mark project complete
   exportPdf()                           // PDF generation
   downloadTranscription(projectId)      // Text export
   ```

**Advanced Features**:
- **Automatic Paragraph Formatting**: Analyzes speech patterns and discourse markers
- **Pali Term Recognition**: RegEx-based detection with visual highlighting
- **Error Recovery**: Comprehensive error handling with user guidance
- **State Management**: Maintains application state across user actions

---

#### **project-manager-server.js** - Data Management Layer
**Purpose**: Handles all project data operations and server communication.

**Core Architecture**:
```javascript
class ProjectManagerServer {
    constructor() {
        this.projects = [];              // Local project cache
        this.apiBaseUrl = 'http://localhost:5000/api';
    }
}
```

**Key Methods**:

1. **Project CRUD Operations**
   ```javascript
   async createProject(projectData)     // Create new project
   async getProject(id, forceFresh)     // Retrieve project data
   async updateProject(id, updates)     // Modify project
   async deleteProject(id)              // Remove project
   getAllProjects()                     // Get all projects
   ```

2. **Server Communication**
   ```javascript
   async saveProjectToServer(project)   // Persist to backend
   async loadProjectsFromServer()       // Fetch all projects
   handleServerError(error)             // Error management
   ```

3. **Data Validation & Processing**
   ```javascript
   validateProjectData(data)            // Input validation
   sanitizeProjectData(data)            // Data cleaning
   generateProjectId()                  // Unique ID creation
   ```

**Features**:
- **Local Caching**: Maintains in-memory project cache for performance
- **Server Synchronization**: Automatic sync with Flask backend
- **Error Handling**: Robust error recovery and user notification
- **Data Validation**: Input sanitization and validation

---

#### **config.js** - Application Configuration
**Purpose**: Centralized configuration management for all application settings.

**Configuration Sections**:
```javascript
const CONFIG = {
    PROJECT_STATUS: {
        NEW: 'New',
        PROCESSING: 'Processing', 
        NEEDS_REVIEW: 'Needs Review',
        COMPLETED: 'Completed',
        APPROVED: 'Approved',
        ERROR: 'Error'
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

---

#### **utils.js** - Utility Functions
**Purpose**: Common utility functions used across the application.

**Key Utility Categories**:
```javascript
const UTILS = {
    // String manipulation
    escapeHtml(text),
    sanitizeFilename(filename),
    truncateText(text, maxLength),
    
    // File handling
    formatFileSize(bytes),
    getFileExtension(filename),
    validateAudioFile(file),
    
    // Date/Time formatting
    formatDate(date),
    getRelativeTime(date),
    formatDuration(seconds),
    
    // DOM manipulation
    createElement(tag, className, content),
    toggleClass(element, className),
    findParentByClass(element, className)
};
```

---

### 3. Backend Architecture

#### **palascribe_server.py** - Main Flask Server
**Purpose**: Provides RESTful API endpoints for project management and audio processing.

**Key Components**:

1. **Flask Application Setup**
   ```python
   app = Flask(__name__)
   app.config['UPLOAD_FOLDER'] = 'uploads'
   app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB
   ```

2. **Database Management**
   ```python
   def init_db():
       # SQLite database initialization
       # Project table creation
       # Index optimization
   
   def get_db_connection():
       # Database connection management
       # Row factory configuration
   ```

3. **API Endpoints**
   ```python
   @app.route('/api/projects', methods=['GET', 'POST'])
   def handle_projects():
       # GET: Return all projects
       # POST: Create new project
   
   @app.route('/api/projects/<project_id>', methods=['GET', 'PUT', 'DELETE'])
   def handle_project(project_id):
       # GET: Retrieve specific project
       # PUT: Update project data
       # DELETE: Remove project
   
   @app.route('/api/transcribe', methods=['POST'])
   def transcribe_audio():
       # Audio file processing
       # Whisper integration
       # Progress tracking
   ```

4. **File Upload Handling**
   ```python
   def save_uploaded_file(file):
       # File validation
       # Secure filename generation
       # Storage management
   
   def process_audio_file(file_path, project_id):
       # Audio format validation
       # Whisper processing coordination
       # Error handling
   ```

**Features**:
- **RESTful API Design**: Standard HTTP methods for resource management
- **File Upload Security**: Secure file handling with validation
- **Database Integration**: SQLite with JSON field support
- **Error Handling**: Comprehensive error responses with logging
- **CORS Support**: Cross-origin resource sharing for development

---

#### **whisper_server.py** - AI Transcription Service
**Purpose**: Dedicated server for handling Whisper AI transcription processing.

**Core Architecture**:
```python
class WhisperServer:
    def __init__(self):
        self.model = None
        self.processing_queue = []
        self.current_job = None
    
    def load_model(self, model_name="base"):
        # Whisper model initialization
        # GPU/CPU optimization
        
    def transcribe_audio(self, audio_path, options={}):
        # Audio preprocessing
        # Whisper transcription
        # Post-processing
```

**Key Methods**:
1. **Model Management**
   ```python
   def initialize_whisper()          # Model loading
   def optimize_for_hardware()       # Performance tuning
   def cleanup_model()               # Memory management
   ```

2. **Audio Processing**
   ```python
   def preprocess_audio(file_path)   # Audio format conversion
   def transcribe_with_progress()    # Progress tracking
   def post_process_text(text)       # Text cleanup
   ```

3. **Server Endpoints**
   ```python
   @app.route('/transcribe', methods=['POST'])
   def handle_transcription():
       # File processing
       # Progress updates
       # Result delivery
   
   @app.route('/health', methods=['GET'])
   def health_check():
       # Service status
       # Model availability
   ```

---

### 4. Database Schema

#### **SQLite Database Structure** (palascribe.db)
```sql
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastModified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'New',
    assignedTo TEXT,
    audioFileName TEXT,
    audioFilePath TEXT,
    audioUrl TEXT,
    audioType TEXT,
    transcription TEXT,
    editedText TEXT,
    richContent TEXT,
    formattedText TEXT,
    approvedDate TIMESTAMP,
    metadata TEXT  -- JSON field for additional data
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created ON projects(created);
CREATE INDEX idx_projects_assigned ON projects(assignedTo);
```

**Field Descriptions**:
- **id**: Unique project identifier (UUID)
- **transcription**: Raw Whisper output
- **editedText**: User-modified plain text
- **richContent**: HTML content from rich text editor
- **formattedText**: Processed text with Pali highlighting
- **metadata**: JSON field for extensible project data

---

## Inter-Module Communication

### **Frontend Data Flow**
```
User Action → UIController → ProjectManager → Server API → Database
                ↓
        DOM Updates ← UI State ← Response Processing ← API Response
```

### **Backend Processing Flow**
```
API Request → Flask Router → Database Query → Business Logic → Response
                ↓
    Whisper Server ← Audio Processing ← File Upload ← Validation
```

### **Real-time Updates**
```
Transcription Progress → Whisper Server → Flask Server → 
WebSocket/Polling → UIController → Progress Modal Updates
```

## Code Quality & Architecture Patterns

### **Design Patterns Used**
1. **MVC Architecture**: Separation of concerns between UI, logic, and data
2. **Module Pattern**: JavaScript modules with clear interfaces
3. **Observer Pattern**: Event-driven communication between components
4. **Factory Pattern**: Dynamic creation of UI elements and project objects
5. **Singleton Pattern**: Single instance of core controllers and managers

### **Error Handling Strategy**
1. **Graceful Degradation**: Core functionality works even if advanced features fail
2. **User-Friendly Messages**: Technical errors translated to actionable user guidance
3. **Logging System**: Comprehensive logging for debugging and monitoring
4. **Retry Mechanisms**: Automatic retry for transient failures
5. **Fallback Options**: Alternative workflows when primary systems fail

### **Performance Optimizations**
1. **Lazy Loading**: Components loaded only when needed
2. **Caching Strategy**: Project data cached locally with smart invalidation
3. **Debounced Operations**: Search and auto-save operations optimized
4. **Progressive Enhancement**: Basic functionality first, enhancements layered on
5. **Memory Management**: Proper cleanup of audio files and large objects

---

*This code documentation provides a comprehensive overview of PALAScribe's architecture, enabling developers to understand, maintain, and extend the application effectively.*
