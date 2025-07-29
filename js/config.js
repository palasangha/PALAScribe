// Configuration file for PALAScribe - Simplified Workflow 2025-07-16
const CONFIG = {
    // OpenAI API Configuration
    OPENAI: {
        API_URL: 'https://api.openai.com/v1/audio/transcriptions',
        MODEL: 'whisper-1',
        // Note: In production, API key should be handled server-side
        API_KEY: '', // To be set by user or environment
    },

    // Project Status Enum - Simplified Workflow
    PROJECT_STATUS: {
        NEW: 'New',
        PROCESSING: 'Processing',
        NEEDS_REVIEW: 'Needs_Review',
        COMPLETED: 'Completed',
        APPROVED: 'Approved',
        ERROR: 'Error'
    },

    // File Configuration
    FILES: {
        SUPPORTED_AUDIO_FORMATS: [
            'audio/mp3',
            'audio/mpeg',
            'audio/wav',
            'audio/m4a',
            'audio/flac',
            'audio/ogg'
        ],
        MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB limit for OpenAI Whisper
        DOCX_NAMING: {
            GENERATED_SUFFIX: '_Generated.docx',
            REVIEWED_SUFFIX: '_Reviewed.docx'
        }
    },

    // UI Configuration
    UI: {
        ANIMATION_DURATION: 300,
        SEARCH_DEBOUNCE_TIME: 300,
        AUTO_SAVE_INTERVAL: 5000,
        NOTIFICATION_TIMEOUT: 5000,
        // Preview Mode Settings
        PREVIEW_MODE: {
            ENABLED: true, // Enable preview mode feature
            DEFAULT_DURATION: 60, // Default preview duration in seconds
            MAX_DURATION: 300 // Maximum preview duration in seconds (5 minutes)
        }
    },

    // Local Whisper Backend Configuration (now integrated into PALAScribe server)
    WHISPER_BACKEND: {
        URL: 'http://localhost:8765/process', // Consolidated into PALAScribe server
        TIMEOUT: 1800000, // 30 minutes timeout (1800 seconds) - for very large audio files
        MODELS: ['tiny', 'small', 'medium', 'large'],
        DEFAULT_MODEL: 'medium',
        LANGUAGES: ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Japanese', 'Korean', 'Chinese'],
        PREVIEW_DURATION: 60 // Preview mode: process only first 60 seconds for testing
    },

    // WHISPER configuration (alternative naming used in some parts of code)
    WHISPER: {
        BACKEND_URL: 'http://localhost:8765', // Consolidated into PALAScribe server
        TIMEOUT: 1800000,
        DEFAULT_MODEL: 'medium'
    },

    // Preview Mode Settings
    PREVIEW: {
        ENABLED: true,
        DURATION_SECONDS: 60,
        DESCRIPTION: "Process only first 60 seconds for quick testing"
    },

    // Storage Keys for localStorage
    STORAGE_KEYS: {
        PROJECTS: 'audioTextConverter_projects',
        SETTINGS: 'audioTextConverter_settings',
        API_KEY: 'audioTextConverter_apiKey'
    },

    // Mock Data for Development
    MOCK: {
        ENABLE_MOCK_API: true, // Set to false when using real OpenAI API
        TRANSCRIPTION_DELAY: 3000, // Simulate API delay in milliseconds
        SAMPLE_TRANSCRIPTION: `
This is a sample transcription of your audio file. The system has identified several Pali words in the text.

The Buddha taught about dukkha (suffering) and the path to nibbana (liberation). 
In the Dhammapada, it is written that "Sabbaṃ saṅkhāraṃ aniccaṃ" - all conditioned things are impermanent.

The practice of vipassana meditation helps develop paññā (wisdom) and leads to the cessation of saṃsāra.
Through right understanding of the Four Noble Truths and the Noble Eightfold Path, one can achieve moksha.

This is just a sample text to demonstrate the Pali word recognition and formatting capabilities.
        `.trim()
    },

    // Error Messages
    ERRORS: {
        FILE_TOO_LARGE: 'File size exceeds the maximum limit of 25MB.',
        UNSUPPORTED_FORMAT: 'Unsupported audio format. Please use MP3, WAV, M4A, FLAC, or OGG.',
        TRANSCRIPTION_FAILED: 'Audio transcription failed. Please try again.',
        PROJECT_NOT_FOUND: 'Project not found.',
        NETWORK_ERROR: 'Network error. Please check your connection and try again.',
        API_KEY_MISSING: 'OpenAI API key is required for transcription.',
        INVALID_PROJECT_NAME: 'Project name cannot be empty.',
        DUPLICATE_PROJECT_NAME: 'A project with this name already exists.'
    },

    // Success Messages
    SUCCESS: {
        PROJECT_CREATED: 'Project created successfully!',
        AUDIO_UPLOADED: 'Audio file uploaded successfully!',
        TRANSCRIPTION_COMPLETE: 'Audio transcription completed successfully!',
        REVIEW_STARTED: 'Review process started.',
        REVIEW_COMPLETE: 'Project review completed successfully!',
        FILE_DOWNLOADED: 'File downloaded successfully!',
        SETTINGS_SAVED: 'Settings saved successfully!'
    }
};

// Utility Functions
const UTILS = {
    // Generate unique ID for projects
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Format date for display
    formatDate: (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Format file size
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Validate file type
    isValidAudioFile: (file) => {
        return CONFIG.FILES.SUPPORTED_AUDIO_FORMATS.includes(file.type);
    },

    // Validate file size
    isValidFileSize: (file) => {
        return file.size <= CONFIG.FILES.MAX_FILE_SIZE;
    },

    // Sanitize filename
    sanitizeFilename: (filename) => {
        return filename.replace(/[^a-z0-9\-_\.]/gi, '_');
    },

    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Deep clone object
    deepClone: (obj) => {
        return JSON.parse(JSON.stringify(obj));
    },

    // Show notification
    showNotification: (message, type = 'info', duration = CONFIG.UI.NOTIFICATION_TIMEOUT) => {
        // This will be implemented in the UI controller
        console.log(`[${type.toUpperCase()}] ${message}`);
    },

    // Escape HTML characters to prevent XSS
    escapeHtml: (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, UTILS };
}
