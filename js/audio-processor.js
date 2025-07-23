// Audio Processing Module for OpenAI Whisper Integration
class AudioProcessor {
    constructor() {
        this.isProcessing = false;
        this.currentRequest = null;
    }

    // Main method to process audio file
    async processAudio(audioFile, projectName, transcriptionMethod = 'api', apiKey = null) {
        if (this.isProcessing) {
            throw new Error('Another audio processing operation is already in progress');
        }

        try {
            this.isProcessing = true;
            
            // Validate audio file based on transcription method
            this.validateAudioFile(audioFile, transcriptionMethod);
            
            // Use mock API if enabled, otherwise call real OpenAI API
            let transcriptionResult;
            if (CONFIG.MOCK.ENABLE_MOCK_API) {
                transcriptionResult = await this.mockTranscribeAudio(audioFile, projectName);
            } else if (transcriptionMethod === 'local') {
                // For local whisper, we just return a placeholder
                transcriptionResult = "Local Whisper processing - please use terminal commands";
            } else {
                transcriptionResult = await this.transcribeWithOpenAI(audioFile, apiKey);
            }

            // Process the transcription with Pali word formatting
            const formattedText = this.formatTranscription(transcriptionResult);

            // Generate DOCX file
            const docxInfo = await this.generateDocxFile(formattedText, projectName);

            return {
                success: true,
                transcription: transcriptionResult,
                formattedText: formattedText,
                docxInfo: docxInfo
            };

        } catch (error) {
            console.error('Audio processing failed:', error);
            
            // Enhance error message with more details
            let detailedError = error.message;
            
            // Add context based on error type
            if (error.message.includes('Failed to fetch')) {
                detailedError = `Network connection failed. This usually means:\n• The Whisper server is not running\n• Check if port 5000 is available\n• Try running: python whisper_server.py\n\nOriginal error: ${error.message}`;
            } else if (error.message.includes('API key')) {
                detailedError = `OpenAI API authentication failed:\n• Check if your API key is valid\n• Ensure you have sufficient credits\n• Verify API key format (starts with 'sk-')\n\nOriginal error: ${error.message}`;
            } else if (error.message.includes('File too large')) {
                detailedError = `Audio file is too large for OpenAI API:\n• Maximum size: 25MB\n• Consider using local Whisper for larger files\n• Try compressing the audio file\n\nOriginal error: ${error.message}`;
            } else if (error.message.includes('Unsupported format')) {
                detailedError = `Audio format not supported:\n• Supported formats: MP3, WAV, M4A, FLAC, OGG\n• Try converting your file to MP3 or WAV\n• Check if file is corrupted\n\nOriginal error: ${error.message}`;
            } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
                detailedError = `API usage limit reached:\n• You've exceeded your OpenAI quota\n• Try again later or upgrade your plan\n• Consider using local Whisper as alternative\n\nOriginal error: ${error.message}`;
            } else if (error.name === 'AbortError') {
                detailedError = 'Processing was cancelled by user';
            } else {
                // For unknown errors, provide troubleshooting steps
                detailedError = `Transcription failed:\n${error.message}\n\nTroubleshooting steps:\n• Check your internet connection\n• Verify audio file is not corrupted\n• Try with a smaller file\n• Check console for technical details`;
            }
            
            return {
                success: false,
                error: detailedError,
                errorType: this.categorizeError(error)
            };
        } finally {
            this.isProcessing = false;
            this.currentRequest = null;
        }
    }

    // Validate audio file before processing
    validateAudioFile(file, transcriptionMethod = 'api') {
        if (!file) {
            throw new Error('No audio file provided');
        }

        if (!UTILS.isValidAudioFile(file)) {
            throw new Error(CONFIG.ERRORS.UNSUPPORTED_FORMAT);
        }

        // Only enforce file size limit for OpenAI API, not for local whisper
        if (transcriptionMethod === 'api' && !UTILS.isValidFileSize(file)) {
            throw new Error(CONFIG.ERRORS.FILE_TOO_LARGE);
        }
    }

    // Mock audio transcription for development
    async mockTranscribeAudio(audioFile, projectName) {
        console.log(`Mock transcribing: ${audioFile.name} for project: ${projectName}`);
        
        // Simulate API delay
        await this.delay(CONFIG.MOCK.TRANSCRIPTION_DELAY);
        
        // Return mock transcription
        return CONFIG.MOCK.SAMPLE_TRANSCRIPTION;
    }

    // Real OpenAI Whisper API transcription
    async transcribeWithOpenAI(audioFile, apiKey) {
        if (!apiKey) {
            throw new Error(CONFIG.ERRORS.API_KEY_MISSING);
        }

        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('model', CONFIG.OPENAI.MODEL);
        formData.append('response_format', 'text');

        const response = await fetch(CONFIG.OPENAI.API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMessage = errorData.error?.message || CONFIG.ERRORS.TRANSCRIPTION_FAILED;
            
            // Enhance error message based on status code
            if (response.status === 401) {
                errorMessage = `Authentication failed (401): Invalid or expired API key.\n• Check your OpenAI API key\n• Ensure it starts with 'sk-'\n• Verify it hasn't been revoked`;
            } else if (response.status === 403) {
                errorMessage = `Access forbidden (403): API key lacks required permissions.\n• Check if your API key has Whisper access\n• Verify your organization settings`;
            } else if (response.status === 429) {
                errorMessage = `Rate limit exceeded (429): Too many requests.\n• You've hit your API quota or rate limit\n• Try again in a few minutes\n• Consider upgrading your OpenAI plan`;
            } else if (response.status === 413) {
                errorMessage = `File too large (413): Audio file exceeds size limit.\n• Maximum file size is 25MB for OpenAI API\n• Try compressing your audio file\n• Consider using local Whisper for larger files`;
            } else if (response.status >= 500) {
                errorMessage = `Server error (${response.status}): OpenAI service temporarily unavailable.\n• Try again in a few minutes\n• Check OpenAI status page\n• Consider using local Whisper as backup`;
            } else {
                errorMessage = `API error (${response.status}): ${errorMessage}\n• Check your internet connection\n• Verify your API key is valid\n• Try again with a different file`;
            }
            
            throw new Error(errorMessage);
        }

        const transcription = await response.text();
        return transcription;
    }

    // Format transcription with Pali word highlighting
    formatTranscription(text) {
        if (!text) return '';
        
        // Use Pali processor to format words
        return paliProcessor.formatPaliWords(text);
    }

    // Generate DOCX file from formatted text
    async generateDocxFile(formattedText, projectName) {
        const fileName = `${UTILS.sanitizeFilename(projectName)}${CONFIG.FILES.DOCX_NAMING.GENERATED_SUFFIX}`;
        
        // For this basic implementation, we'll create a simple text-based "DOCX"
        // In a real implementation, you'd use a library like docx or mammoth
        const docxContent = this.createDocxContent(formattedText, projectName);
        
        // Create blob for download
        const blob = new Blob([docxContent], { 
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        
        const url = URL.createObjectURL(blob);
        
        return {
            fileName: fileName,
            blob: blob,
            url: url,
            size: blob.size,
            created: new Date().toISOString()
        };
    }

    // Create DOCX content (simplified version)
    createDocxContent(formattedText, projectName) {
        // This is a simplified approach for demo purposes
        // In production, use proper DOCX generation libraries
        const content = `
PALAScribe - Transcription Report
Project: ${projectName}
Generated: ${new Date().toLocaleString()}
---

${this.convertHtmlToPlainText(formattedText)}

---
Generated by PALAScribe
        `.trim();
        
        return content;
    }

    // Convert HTML formatted text to plain text for DOCX
    convertHtmlToPlainText(html) {
        // Simple HTML to text conversion
        // In production, use proper HTML parsing
        return html
            .replace(/<span class="pali-word"[^>]*>/g, '**')
            .replace(/<\/span>/g, '**')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"');
    }

    // Utility method for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Cancel current processing (if supported)
    cancelProcessing() {
        if (this.currentRequest) {
            // Abort fetch request if possible
            if (this.currentRequest.abort) {
                this.currentRequest.abort();
            }
        }
        this.isProcessing = false;
        this.currentRequest = null;
    }

    // Get processing status
    getProcessingStatus() {
        return {
            isProcessing: this.isProcessing,
            hasActiveRequest: this.currentRequest !== null
        };
    }

    // Categorize errors for better handling
    categorizeError(error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
            return 'network';
        } else if (error.message.includes('API key') || error.message.includes('authentication')) {
            return 'authentication';
        } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
            return 'quota';
        } else if (error.message.includes('File too large') || error.message.includes('size')) {
            return 'filesize';
        } else if (error.message.includes('format') || error.message.includes('Unsupported')) {
            return 'format';
        } else if (error.name === 'AbortError') {
            return 'cancelled';
        } else {
            return 'unknown';
        }
    }
}

// Audio file validation utilities
class AudioFileValidator {
    static validateFile(file, transcriptionMethod = 'api') {
        const errors = [];

        if (!file) {
            errors.push('No file provided');
            return errors;
        }

        // Check file type
        if (!UTILS.isValidAudioFile(file)) {
            errors.push(CONFIG.ERRORS.UNSUPPORTED_FORMAT);
        }

        // Check file size - only for API method, not for local whisper
        if (transcriptionMethod === 'api' && !UTILS.isValidFileSize(file)) {
            errors.push(CONFIG.ERRORS.FILE_TOO_LARGE);
        }

        // Check file name
        if (!file.name || file.name.trim() === '') {
            errors.push('File must have a valid name');
        }

        return errors;
    }

    static getSupportedFormats() {
        return CONFIG.FILES.SUPPORTED_AUDIO_FORMATS.map(format => {
            return format.split('/')[1].toUpperCase();
        }).join(', ');
    }

    static getMaxFileSize() {
        return UTILS.formatFileSize(CONFIG.FILES.MAX_FILE_SIZE);
    }
}

// File download utilities
class FileDownloadManager {
    static downloadFile(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL after download
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    }

    static downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        this.downloadFile(url, filename);
    }

    static downloadText(text, filename, mimeType = 'text/plain') {
        const blob = new Blob([text], { type: mimeType });
        this.downloadBlob(blob, filename);
    }
}

// Create global instances
const audioProcessor = new AudioProcessor();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        AudioProcessor, 
        AudioFileValidator, 
        FileDownloadManager, 
        audioProcessor 
    };
}
