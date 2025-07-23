// Fixed UI Controller for managing user interface interactions
class UIController {
    constructor() {
        console.log('🔧 UIController constructor started');
        try {
            this.currentView = 'dashboard'; // Changed from 'projects' to 'dashboard'
            this.currentProject = null;
            this.searchDebounce = null;
            this.elements = {};
            this.isProcessing = false;
            this.currentProcessId = null;
            this.sortDirection = 'asc'; // Default sort direction
            this.sortColumn = 'name'; // Default sort column
            this.hasLoggedNoProject = false; // Flag to prevent console spam
            this.commandUpdateTimeout = null; // Timeout for debounced updates
            this.isSourceMode = false; // Rich text editor mode flag
            
            console.log('🔧 UIController properties initialized, calling init...');
            this.init();
            console.log('✅ UIController constructor completed successfully');
        } catch (error) {
            console.error('❌ UIController constructor failed:', error);
            console.error('Error stack:', error.stack);
            throw error;
        }
    }

    // Initialize UI controller
    init() {
        console.log('🔧 UIController init started');
        try {
            this.cacheElements();
            console.log('✅ Elements cached');
            
            this.bindEvents();
            console.log('✅ Events bound');
            
            this.showView('dashboard');
            console.log('✅ Initial view shown (dashboard)');
            
            // All methods enabled - should work now
            this.refreshProjectsList();
            console.log('✅ Projects list refreshed');
            
            this.initTableSorting();
            console.log('✅ Table sorting initialized');
            
            this.initRowSelection();
            console.log('✅ Row selection initialized');
            
            console.log('✅ UIController init completed (simplified)');
        } catch (error) {
            console.error('❌ UIController init failed:', error);
            console.error('Error stack:', error.stack);
            throw error;
        }
        
        // Check if we're being launched from the launcher (check URL params)
        const urlParams = new URLSearchParams(window.location.search);
        const autoStart = urlParams.get('autostart');
        
        if (autoStart === 'true') {
            // Auto-start backend if launched from launcher
            console.log('🔄 Auto-start requested from launcher');
            setTimeout(() => this.autoStartWhisperBackend(), 1000);
        } else {
            // Just check backend status without auto-starting
            setTimeout(() => this.checkAndUpdateBackendStatus(), 1000);
        }
        
        // Rich Text Editor Toolbar
        this.initializeRichTextEditor();
        
        // Add table sorting functionality
        this.initTableSorting();
        
        // Add row selection functionality
        this.initRowSelection();
    }

    // Cache DOM elements
    cacheElements() {
        console.log('📋 Caching DOM elements...');
        try {
            this.elements = {
            // Dashboard navigation buttons
            btnStartConversion: document.getElementById('btn-start-conversion'),
            btnReadyReview: document.getElementById('btn-ready-review'),
            btnApproved: document.getElementById('btn-approved'),
            
            // Back to dashboard buttons
            btnBackToDashboardReview: document.getElementById('btn-back-to-dashboard-review'),
            btnBackToDashboardApproved: document.getElementById('btn-back-to-dashboard-approved'),
            
            // Clear all buttons for filtered views
            btnClearAllReview: document.getElementById('btn-clear-all-review'),
            btnClearAllApproved: document.getElementById('btn-clear-all-approved'),
            
            // Modal elements
            newProjectModal: document.getElementById('new-project-modal'),
            btnCloseModal: document.getElementById('btn-close-modal'),

            // Main navigation (legacy)
            btnNewProject: document.getElementById('btn-new-project'),
            btnClearAllProjects: document.getElementById('btn-clear-all-projects'),

            // Create project form
            createProjectForm: document.getElementById('create-project-form'),
            projectName: document.getElementById('project-name'),
            assignedTo: document.getElementById('assigned-to'),
            projectAudioFile: document.getElementById('project-audio-file'),
            previewMode: document.getElementById('project-preview-mode'),
            btnCancelCreate: document.getElementById('btn-cancel-create'),
            
            // Review project
            projectDetails: document.getElementById('project-details'),
            btnBackToProjects: document.getElementById('btn-back-to-projects'),
            reviewProjectInfo: document.getElementById('review-project-info'),
            reviewAudioPlayer: document.getElementById('review-audio-player'),
            transcriptionEditor: document.getElementById('transcription-editor'),
            transcriptionPreview: document.getElementById('transcription-preview'),
            wordCount: document.getElementById('word-count'),
            characterCount: document.getElementById('character-count'),
            btnSaveDraft: document.getElementById('btn-save-draft'),
            btnResetText: document.getElementById('btn-reset-text'),
            btnApproveFinal: document.getElementById('btn-approve-final'),
            btnDownloadFinal: document.getElementById('btn-download-final'),

            // Projects list
            projectsList: document.getElementById('projects-list'),
            projectsTableBody: document.getElementById('projects-table-body'),
            emptyProjectsState: document.getElementById('empty-projects-state'),
            searchProjects: document.getElementById('search-projects'),
            
            // Ready for Review view
            reviewProjectsTableBody: document.getElementById('review-projects-table-body'),
            emptyReviewState: document.getElementById('empty-review-state'),
            searchReviewProjects: document.getElementById('search-review-projects'),
            
            // Approved view
            approvedProjectsTableBody: document.getElementById('approved-projects-table-body'),
            emptyApprovedState: document.getElementById('empty-approved-state'),
            searchApprovedProjects: document.getElementById('search-approved-projects'),

            // Processing status
            processingStatusBar: document.getElementById('processing-status-indicator'),
            processingStatusMessage: document.getElementById('processing-status-text'),
            btnCancelProcessing: document.getElementById('btn-cancel-processing'),
            btnCancelBackgroundProcessing: document.getElementById('btn-cancel-background-processing'),

            // Notifications
            notificationContainer: document.getElementById('notification-container'),

            // Views
            viewDashboard: document.getElementById('view-dashboard'),
            viewReadyReview: document.getElementById('view-ready-review'),
            viewApproved: document.getElementById('view-approved'),
            viewProjects: document.getElementById('view-projects'),
            viewCreate: document.getElementById('view-create'),
            viewLocal: document.getElementById('view-local'),
            viewReview: document.getElementById('view-review')
        };

        // Debug: Check if critical elements are found
        const criticalElements = ['createProjectForm', 'projectName', 'projectAudioFile', 'btnStartConversion', 'newProjectModal'];
        criticalElements.forEach(elementName => {
            const element = this.elements[elementName];
            if (!element) {
                console.error(`❌ Critical element not found: ${elementName}`);
            } else {
                console.log(`✅ Found element: ${elementName}`);
            }
        });
        
        console.log('📋 DOM elements cached:', this.elements);
        } catch (error) {
            console.error('❌ Error caching elements:', error);
            throw error;
        }
    }

    // Bind event listeners
    bindEvents() {
        // Dashboard navigation buttons
        if (this.elements.btnStartConversion) {
            this.elements.btnStartConversion.addEventListener('click', () => {
                console.log('🔔 Start Audio Conversion button clicked');
                this.showNewProjectModal();
            });
        }
        
        if (this.elements.btnReadyReview) {
            this.elements.btnReadyReview.addEventListener('click', () => {
                console.log('🔔 Ready for Review button clicked');
                this.showView('ready-review');
            });
        }
        
        if (this.elements.btnApproved) {
            this.elements.btnApproved.addEventListener('click', () => {
                console.log('🔔 Approved button clicked');
                this.showView('approved');
            });
        }
        
        // Back to dashboard buttons
        if (this.elements.btnBackToDashboardReview) {
            this.elements.btnBackToDashboardReview.addEventListener('click', () => {
                this.showView('dashboard');
            });
        }
        
        if (this.elements.btnBackToDashboardApproved) {
            this.elements.btnBackToDashboardApproved.addEventListener('click', () => {
                this.showView('dashboard');
            });
        }
        
        // Clear all buttons for filtered views
        if (this.elements.btnClearAllReview) {
            this.elements.btnClearAllReview.addEventListener('click', () => {
                console.log('🗑️ Clear All Review Projects button clicked');
                this.clearProjectsByStatus('NEEDS_REVIEW');
            });
        }
        
        if (this.elements.btnClearAllApproved) {
            this.elements.btnClearAllApproved.addEventListener('click', () => {
                console.log('🗑️ Clear All Approved Projects button clicked');
                this.clearProjectsByStatus('APPROVED');
            });
        }
        
        // Modal handling
        if (this.elements.btnCloseModal) {
            this.elements.btnCloseModal.addEventListener('click', () => {
                this.hideNewProjectModal();
            });
        }
        
        // Close modal when clicking outside
        if (this.elements.newProjectModal) {
            this.elements.newProjectModal.addEventListener('click', (e) => {
                if (e.target === this.elements.newProjectModal) {
                    this.hideNewProjectModal();
                }
            });
        }

        // Tab navigation (legacy - may not be needed)
        if (this.elements.tabProjects) {
            this.elements.tabProjects.addEventListener('click', () => this.showView('projects'));
        }
        if (this.elements.tabCreate) {
            this.elements.tabCreate.addEventListener('click', () => this.showView('create'));
        }
        if (this.elements.tabLocal) {
            this.elements.tabLocal.addEventListener('click', () => this.showView('local'));
        }

        // Project management
        if (this.elements.btnNewProject) {
            this.elements.btnNewProject.addEventListener('click', () => {
                console.log('🔔 New Project button clicked');
                this.showView('create');
            });
        }
        if (this.elements.btnClearAllProjects) {
            this.elements.btnClearAllProjects.addEventListener('click', () => {
                console.log('🗑️ Clear All Projects button clicked');
                this.clearAllProjects();
            });
        }
        if (this.elements.btnBackToProjects) {
            this.elements.btnBackToProjects.addEventListener('click', () => this.showView('dashboard'));
        }

        // Review/Edit functionality
        if (this.elements.transcriptionEditor) {
            this.elements.transcriptionEditor.addEventListener('input', () => {
                this.updateWordCount();
            });
        }

        if (this.elements.btnSaveDraft) {
            this.elements.btnSaveDraft.addEventListener('click', () => {
                this.saveDraft();
            });
        }

        if (this.elements.btnResetText) {
            this.elements.btnResetText.addEventListener('click', () => {
                this.resetToOriginalText();
            });
        }

        if (this.elements.btnApproveFinal) {
            console.log('✅ Binding event to Approve Final button');
            this.elements.btnApproveFinal.addEventListener('click', () => {
                console.log('🔔 Approve Final button clicked');
                this.approveFinal();
            });
        } else {
            console.error('❌ Approve Final button not found in DOM');
        }

        if (this.elements.btnDownloadFinal) {
            this.elements.btnDownloadFinal.addEventListener('click', () => {
                this.downloadFinal();
            });
        }

        // Search functionality for different views
        if (this.elements.searchProjects) {
            this.elements.searchProjects.addEventListener('input', (e) => {
                this.debouncedSearch(e.target.value);
            });
        }
        
        if (this.elements.searchReviewProjects) {
            this.elements.searchReviewProjects.addEventListener('input', (e) => {
                this.debouncedSearch(e.target.value, 'review');
            });
        }
        
        if (this.elements.searchApprovedProjects) {
            this.elements.searchApprovedProjects.addEventListener('input', (e) => {
                this.debouncedSearch(e.target.value, 'approved');
            });
        }

        // Create project form
        if (this.elements.createProjectForm) {
            this.elements.createProjectForm.addEventListener('submit', (e) => {
                console.log('📝 Form submit event triggered');
                e.preventDefault();
                console.log('🚀 Calling handleCreateProject...');
                this.handleCreateProject();
            });
        }

        if (this.elements.btnCancelCreate) {
            this.elements.btnCancelCreate.addEventListener('click', () => {
                this.resetCreateForm();
                this.hideNewProjectModal();
            });
        }

        // Processing cancel buttons
        if (this.elements.btnCancelProcessing) {
            this.elements.btnCancelProcessing.addEventListener('click', () => {
                this.cancelCurrentProcessing();
            });
        }

        if (this.elements.btnCancelBackgroundProcessing) {
            this.elements.btnCancelBackgroundProcessing.addEventListener('click', () => {
                this.cancelCurrentProcessing();
            });
        }

        // Modal close
        if (this.elements.closeSuccessModal) {
            this.elements.closeSuccessModal.addEventListener('click', () => {
                this.hideModal('success');
            });
        }

        // Transcription editor events
        if (this.elements.transcriptionEditor) {
            console.log('✅ Found transcription editor, binding events');
            
            // Debounced input handler to avoid excessive updates
            let inputTimeout;
            this.elements.transcriptionEditor.addEventListener('input', () => {
                console.log('📝 Text editor input detected');
                
                // Clear previous timeout
                clearTimeout(inputTimeout);
                
                // Debounce the updates to avoid excessive calls
                inputTimeout = setTimeout(() => {
                    this.updateWordCount();
                    this.updateTranscriptionPreview();
                }, 300); // 300ms debounce
            });
            
            // Selection change event to update toolbar states
            this.elements.transcriptionEditor.addEventListener('mouseup', () => {
                this.updateToolbarState();
            });
            
            this.elements.transcriptionEditor.addEventListener('keyup', () => {
                this.updateToolbarState();
            });
            
            // Focus event to ensure toolbar is active
            this.elements.transcriptionEditor.addEventListener('focus', () => {
                console.log('📝 Editor focused');
                this.updateToolbarState();
            });
        } else {
            console.log('❌ Transcription editor not found');
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Handle common keyboard shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveTranscription();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.showCreateProjectModal();
                        break;
                }
            }
        });

        // Backend status events
        if (this.elements.btnTestBackend) {
            this.elements.btnTestBackend.addEventListener('click', () => {
                this.checkAndUpdateBackendStatus();
            });
        }
        
        if (this.elements.btnStartBackend) {
            this.elements.btnStartBackend.addEventListener('click', () => {
                this.handleStartBackendRequest();
            });
        }

        // Auto-fill project name when audio file is selected
        if (this.elements.projectAudioFile) {
            this.elements.projectAudioFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    // Extract filename without extension
                    const fileName = file.name.replace(/\.[^/.]+$/, "");
                    const projectNameInput = document.getElementById('project-name');
                    if (projectNameInput) {
                        projectNameInput.value = fileName;
                    }
                    
                    // Show file size warning for large files
                    this.showFileSizeInfo(file);
                }
            });
        }
    }

    // Show specific view
    showView(viewName) {
        console.log(`🔄 Switching to view: ${viewName}`);
        
        // Update tab states (legacy)
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        });

        // Hide all views
        document.querySelectorAll('.view-content').forEach(view => {
            view.classList.add('hidden');
        });

        // Show selected view
        switch (viewName) {
            case 'dashboard':
                if (this.elements.viewDashboard) this.elements.viewDashboard.classList.remove('hidden');
                break;
                
            case 'ready-review':
                if (this.elements.viewReadyReview) this.elements.viewReadyReview.classList.remove('hidden');
                this.refreshReviewProjectsList();
                break;
                
            case 'approved':
                if (this.elements.viewApproved) this.elements.viewApproved.classList.remove('hidden');
                this.refreshApprovedProjectsList();
                break;
                
            case 'projects':
                if (this.elements.tabProjects) this.elements.tabProjects.classList.add('active');
                if (this.elements.viewProjects) this.elements.viewProjects.classList.remove('hidden');
                this.refreshProjectsList();
                break;
                
            case 'create':
                if (this.elements.tabCreate) this.elements.tabCreate.classList.add('active');
                if (this.elements.viewCreate) this.elements.viewCreate.classList.remove('hidden');
                this.resetCreateForm();
                break;
                
            case 'local':
                if (this.elements.tabLocal) this.elements.tabLocal.classList.add('active');
                if (this.elements.viewLocal) this.elements.viewLocal.classList.remove('hidden');
                this.initializeLocalView();
                break;
                
            case 'review':
                if (this.elements.viewReview) this.elements.viewReview.classList.remove('hidden');
                break;
        }
        this.currentView = viewName;
    }

    // Clear all projects with confirmation
    clearAllProjects() {
        console.log('🗑️ Clear all projects requested');
        
        const projects = projectManager.getAllProjects();
        if (projects.length === 0) {
            this.showSuccessMessage('No projects to clear');
            return;
        }
        
        // Show confirmation dialog
        const confirmed = confirm(`Are you sure you want to delete all ${projects.length} projects? This action cannot be undone.`);
        
        if (confirmed) {
            try {
                projectManager.clearAllProjects();
                this.refreshProjectsList();
                this.showSuccessMessage(`All ${projects.length} projects have been deleted`);
                console.log('✅ All projects cleared successfully');
            } catch (error) {
                console.error('❌ Error clearing projects:', error);
                this.showErrorMessage(`Error clearing projects: ${error.message}`);
            }
        }
    }

    // Handle create project form submission
    async handleCreateProject() {
        console.log('🚀 Create project form submitted');
        
        try {
            // Get form data
            const formData = {
                name: this.elements.projectName?.value?.trim() || '',
                assignedTo: this.elements.assignedTo?.value?.trim() || ''
            };
            
            // Get audio file and preview mode
            const audioFile = this.elements.projectAudioFile?.files[0];
            const previewMode = this.elements.previewMode?.checked || false;
            
            console.log('📝 Form data:', { ...formData, audioFile: audioFile?.name, previewMode });
            
            // Validate required fields
            if (!formData.name) {
                this.showErrorMessage('Please enter a project name');
                return;
            }
            
            if (!audioFile) {
                this.showErrorMessage('Please select an audio file');
                return;
            }

            // Create project (this will show processing modal after)
            const project = projectManager.createProject(formData);
            console.log('✅ Project created:', project.id);

            // Reset form and close modal
            this.resetCreateForm();
            this.hideNewProjectModal();

            // Show success notification and return to dashboard
            this.showView('dashboard');

            // Show transcription modal for processing
            this.showTranscriptionModal(project.id, audioFile, previewMode, formData.name);
            
        } catch (error) {
            console.error('❌ Error creating project:', error);
            this.hideBackgroundProcessing();
            
            // Show detailed error message for project creation
            let errorMessage = error.message;
            
            // Format multi-line error messages
            if (errorMessage.includes('\n')) {
                this.showDetailedError('New Project', errorMessage);
            } else {
                // Simple error handling for basic issues
                if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
                    errorMessage = 'Backend server not running. Please start the Whisper server first.';
                }
                
                this.showErrorMessage('Error creating project: ' + errorMessage);
            }
        }
    }

    // Process project audio in background (non-blocking)
    async processProjectAudioBackground(projectId, audioFile, previewMode = false, projectName = '') {
        console.log('🚀 Starting background audio processing for project:', projectId);
        try {
            // Process audio (this will use the background processing UI)
            await this.processProjectAudio(projectId, audioFile, previewMode);
            
            // Success notification
            this.hideBackgroundProcessing();
            this.showNotification(
                `Project "${projectName}" has been processed successfully! Ready for review.`,
                'success',
                7000
            );
            
            // Refresh the projects list to show the updated status
            this.refreshProjectsList();
            
        } catch (error) {
            console.error('❌ Background processing failed:', error);
            this.hideBackgroundProcessing();
            
            if (error.message !== 'Processing was cancelled') {
                // Show detailed error notification
                let errorMessage = error.message;
                
                // Format multi-line error messages for better readability
                if (errorMessage.includes('\n')) {
                    // For detailed errors, show in a modal or enhanced notification
                    this.showDetailedError(projectName, errorMessage);
                } else {
                    // Simple error message - use regular notification
                    if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
                        errorMessage = 'Backend server not running. Please start the Whisper server first.';
                    }
                    
                    this.showNotification(
                        `Failed to process "${projectName}": ${errorMessage}`,
                        'error',
                        10000
                    );
                }
            } else {
                // Processing was cancelled
                this.showNotification('Processing cancelled', 'info', 3000);
            }
        }
    }

    // Process project audio with transcription
    async processProjectAudio(projectId, audioFile, previewMode = false) {
        console.log('🎵 Processing audio for project:', projectId, 'File:', audioFile.name, 'Preview:', previewMode);
        try {
            // Generate unique process ID for cancellation
            this.currentProcessId = `process_${Date.now()}`;
            this.isProcessing = true;
            
            // Calculate file size and estimated time
            const fileSizeMB = audioFile.size / (1024 * 1024);
            const timeEstimate = this.getProcessingTimeEstimate(fileSizeMB, previewMode);
            
            const previewText = previewMode ? ' (Preview mode - processing first 60 seconds)' : '';
            const sizeText = fileSizeMB > 10 ? ` (${fileSizeMB.toFixed(1)}MB - Est: ${timeEstimate})` : '';
            this.updateBackgroundProcessingMessage(`Transcribing audio${previewText}${sizeText}...`);
            
            console.log('📎 Attaching audio file to project...');
            // Attach audio file to project
            await projectManager.attachAudioFile(projectId, audioFile, 'local', previewMode);
            console.log('✅ Audio file attached successfully');
            
            if (!this.isProcessing) {
                // Processing was cancelled
                throw new Error('Processing was cancelled');
            }
            
            console.log('🔄 Starting Whisper backend processing...');
            // Start audio processing with backend
            await this.processWithWhisperBackend(projectId, audioFile, previewMode);
            console.log('✅ Whisper backend processing completed');
            
        } catch (error) {
            console.error('❌ Error in processProjectAudio:', error);
            if (error.message === 'Processing was cancelled') {
                console.log('🔄 Processing cancelled by user');
                // Clean up project if it was just created
                try {
                    projectManager.deleteProject(projectId);
                } catch (cleanupError) {
                    console.warn('Could not clean up cancelled project:', cleanupError);
                }
                throw error;
            } else {
                console.error('❌ Error processing audio:', error);
                throw error;
            }
        } finally {
            this.isProcessing = false;
            this.currentProcessId = null;
        }
    }

    // Process audio with Whisper backend
    async processWithWhisperBackend(projectId, audioFile, previewMode = false) {
        console.log('🎙️ Processing with Whisper backend. Project:', projectId, 'Preview:', previewMode);
        try {
            const formData = new FormData();
            formData.append('audio', audioFile);
            formData.append('model', 'medium');
            formData.append('language', 'English');
            formData.append('preview', previewMode ? 'true' : 'false');
            if (previewMode) {
                formData.append('preview_duration', '60');
            }

            console.log('📤 Sending request to Whisper backend at http://localhost:8765/process');
            console.log('📋 FormData contents:', {
                audio: audioFile.name,
                model: 'medium',
                language: 'English',
                preview: previewMode ? 'true' : 'false'
            });

            const response = await fetch('http://localhost:8765/process', {
                method: 'POST',
                body: formData
            });

            console.log('📥 Response received:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Backend error response:', errorText);
                throw new Error(`Backend error: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Backend response received:', result);

            // Check if the backend returned an error
            if (result.success === false) {
                throw new Error(result.error || 'Backend processing failed');
            }

            const transcription = result.transcription;
            if (!transcription) {
                throw new Error('No transcription received from backend');
            }

            // Update project with transcription results
            const formattedText = this.formatTranscriptionText(transcription);
            console.log('📝 Updating project with transcription results');
            
            const updateData = {
                transcription: transcription,
                formattedText: formattedText,
                status: CONFIG.PROJECT_STATUS.COMPLETED
            };

            // Add additional metadata if available
            if (result.word_count) updateData.wordCount = result.word_count;
            if (result.processing_time) updateData.processingTime = result.processing_time;
            if (result.preview_mode !== undefined) updateData.isPreview = result.preview_mode;
            if (result.timestamps) updateData.timestamps = result.timestamps;
            
            projectManager.updateProject(projectId, updateData);

            console.log('✅ Project updated with transcription');

        } catch (error) {
            console.error('❌ Whisper backend processing failed:', error);
            
            // Update project status to error
            projectManager.updateProject(projectId, {
                status: CONFIG.PROJECT_STATUS.ERROR,
                error: error.message
            });
            
            throw error;
        }
    }

    // Format transcription text with improvements
    formatTranscriptionText(transcription) {
        if (!transcription) return '';
        
        let formatted = transcription.trim();
        
        // Add header indicating this is generated content
        formatted = '=== GENERATED TRANSCRIPTION ===\n\n' + formatted;
        
        // Auto-paragraph: Split on sentence boundaries followed by longer pauses
        formatted = formatted.replace(/([.!?])\s{2,}/g, '$1\n\n');
        
        // Add paragraph breaks for typical speech patterns
        formatted = formatted.replace(/(\w+[.!?])\s+(Well|So|Now|Then|And then|But|However|Actually)/g, '$1\n\n$2');
        
        // Highlight potential Pali terms (words that might be transliterated)
        formatted = this.highlightPaliTerms(formatted);
        
        // Add footer
        formatted += '\n\n=== END TRANSCRIPTION ===';
        
        return formatted;
    }

    // Highlight potential Pali terms in text
    highlightPaliTerms(text) {
        console.log('🔍 Highlighting Pali terms in text:', text.substring(0, 100));
        
        // Simple heuristic: look for words with diacritics or common Pali patterns
        const paliPatterns = [
            // Words with diacritics
            /\b\w*[āīūṅñṭḍṇḷṃḥṣṛ]\w*\b/g,
            // Common Pali words
            /\b(dhamma|dharma|sangha|buddha|nirvana|nibbana|samsara|karma|kamma|sutra|sutta|bhikkhu|bodhisattva)\b/gi
        ];
        
        let modifiedText = text;
        paliPatterns.forEach((pattern, index) => {
            const matches = modifiedText.match(pattern);
            if (matches) {
                console.log(`✨ Pattern ${index} found matches:`, matches);
            }
            modifiedText = modifiedText.replace(pattern, '<span class="pali-text">$&</span>');
        });
        
        if (modifiedText !== text) {
            console.log('✅ Text modified with Pali highlighting');
        } else {
            console.log('⚠️ No Pali terms found');
        }
        
        return modifiedText;
    }

    // Cancel current processing
    cancelCurrentProcessing() {
        console.log('🛑 Cancelling current processing...');
        
        this.isProcessing = false;
        this.currentProcessId = null;
        
        this.hideBackgroundProcessing();
        this.showNotification('Processing cancelled', 'info', 3000);
    }

    // Background processing UI methods
    showBackgroundProcessing(message) {
        console.log('📝 Starting background processing: ' + message);
        if (this.elements.processingStatusBar) {
            this.elements.processingStatusBar.classList.remove('hidden');
        }
        this.updateBackgroundProcessingMessage(message);
    }

    hideBackgroundProcessing() {
        console.log('📝 Hiding background processing UI');
        if (this.elements.processingStatusBar) {
            this.elements.processingStatusBar.classList.add('hidden');
        }
    }

    updateBackgroundProcessingMessage(message) {
        if (this.elements.processingStatusMessage) {
            this.elements.processingStatusMessage.textContent = message;
        }
        console.log('📝 Background processing: ' + message);
    }

    // Notification system
    showNotification(message, type = 'info', duration = 5000, allowHtml = false) {
        const container = this.elements.notificationContainer;
        if (!container) {
            console.warn('Notification container not found, falling back to alert');
            alert(message.replace(/<[^>]*>/g, '')); // Strip HTML for alert
            return;
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type} mb-4 p-4`;
        
        const icon = this.getNotificationIcon(type);
        const iconColor = type === 'success' ? 'text-green-500' : type === 'error' ? 'text-red-500' : 'text-blue-500';
        
        // Enhanced width for detailed error messages
        const notificationWidth = allowHtml ? 'max-w-2xl' : 'max-w-md';
        
        notification.innerHTML = `
            <div class="flex ${notificationWidth}">
                <div class="flex-shrink-0">
                    <div class="${iconColor}">
                        ${icon}
                    </div>
                </div>
                <div class="ml-3 flex-1">
                    <div class="text-sm ${allowHtml ? 'text-gray-800' : 'font-medium text-gray-800'}">
                        ${allowHtml ? message : this.escapeHtml(message)}
                    </div>
                </div>
                <div class="ml-auto pl-3">
                    <div class="-mx-1.5 -my-1.5">
                        <button type="button" class="inline-flex bg-white rounded-md p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 notification-close">
                            <span class="sr-only">Dismiss</span>
                            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add event listener for close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.dismissNotification(notification);
        });

        // Add to container
        container.appendChild(notification);

        // Auto-dismiss after duration
        if (duration > 0) {
            setTimeout(() => {
                this.dismissNotification(notification);
            }, duration);
        }
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success':
                return `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`;
            case 'error':
                return `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>`;
            default: // info
                return `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`;
        }
    }

    dismissNotification(notification) {
        notification.classList.add('slide-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // Show detailed error in a modal-style notification
    showDetailedError(projectName, errorMessage) {
        // Create a detailed error notification
        const errorTitle = `❌ Failed to process "${projectName}"`;
        const errorBody = errorMessage.replace(/\n/g, '<br>').replace(/•/g, '&nbsp;&nbsp;•');
        
        // Show as a larger, more prominent notification
        this.showNotification(
            `<strong>${errorTitle}</strong><br><br><div style="font-family: monospace; font-size: 0.9em; line-height: 1.4; background: rgba(0,0,0,0.05); padding: 12px; border-radius: 4px; margin-top: 8px;">${errorBody}</div>`,
            'error',
            15000, // Show longer for detailed errors
            true   // Allow HTML content
        );
    }

    // Legacy methods (for backwards compatibility)
    // Show processing modal with cancel button
    showProcessingModal(message) {
        // Use new background processing instead
        this.showBackgroundProcessing(message);
    }

    // Hide processing modal
    hideProcessingModal() {
        // Use new background processing instead
        this.hideBackgroundProcessing();
    }

    // Update processing message
    updateProcessingMessage(message) {
        // Use new background processing instead
        this.updateBackgroundProcessingMessage(message);
    }

    // Show error message
    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    // Show success message
    showSuccessMessage(message) {
        this.showNotification(message, 'success');
    }

    // Reset create form
    resetCreateForm() {
        if (this.elements.createProjectForm) {
            this.elements.createProjectForm.reset();
        }
        console.log('✅ Create form reset');
    }

    // Show modal
    showModal(type, message = null) {
        if (type === 'loading' && this.elements.loadingModal) {
            this.elements.loadingModal.classList.remove('hidden');
        } else if (type === 'success' && this.elements.successModal) {
            if (message && this.elements.successMessage) {
                this.elements.successMessage.textContent = message;
            }
            this.elements.successModal.classList.remove('hidden');
        }
    }

    // Hide modal
    hideModal(type) {
        if (type === 'loading' && this.elements.loadingModal) {
            this.elements.loadingModal.classList.add('hidden');
        } else if (type === 'success' && this.elements.successModal) {
            this.elements.successModal.classList.add('hidden');
        }
    }

    // Refresh projects list
    refreshProjectsList() {
        const projects = projectManager.getAllProjects();
        
        // Update table view
        if (this.elements.projectsTableBody) {
            this.elements.projectsTableBody.innerHTML = '';
            
            if (projects.length === 0) {
                this.elements.projectsTableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                            <div class="flex flex-col items-center">
                                <div class="text-4xl mb-2">🎙️</div>
                                <p>No projects yet. Create your first project to get started!</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            
            projects.forEach(project => {
                const projectRow = this.createProjectTableRow(project);
                this.elements.projectsTableBody.appendChild(projectRow);
            });
        }
        
        // Keep old grid for backward compatibility (hidden)
        if (this.elements.projectsList) {
            this.elements.projectsList.innerHTML = '';
            projects.forEach(project => {
                const projectCard = this.createProjectCard(project);
                this.elements.projectsList.appendChild(projectCard);
            });
        }
    }

    // Create project card HTML
    createProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow';
        
        const statusColor = {
            [CONFIG.PROJECT_STATUS.NEW]: 'bg-blue-100 text-blue-800',
            [CONFIG.PROJECT_STATUS.PROCESSING]: 'bg-yellow-100 text-yellow-800',
            [CONFIG.PROJECT_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
            [CONFIG.PROJECT_STATUS.NEEDS_REVIEW]: 'bg-orange-100 text-orange-800',
            [CONFIG.PROJECT_STATUS.APPROVED]: 'bg-purple-100 text-purple-800',
            [CONFIG.PROJECT_STATUS.ERROR]: 'bg-red-100 text-red-800'
        };
        
        const formattedDate = new Date(project.created).toLocaleDateString();
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h3 class="text-lg font-semibold text-gray-900">${UTILS.escapeHtml(project.name)}</h3>
                <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColor[project.status] || 'bg-gray-100 text-gray-800'}">
                    ${project.status}
                </span>
            </div>
            <div class="text-sm text-gray-600 mb-2">
                <p><strong>Assigned to:</strong> ${UTILS.escapeHtml(project.assignedTo) || 'Unassigned'}</p>
                <p><strong>Created:</strong> ${formattedDate}</p>
                ${project.audioFileName ? `<p><strong>Audio:</strong> ${UTILS.escapeHtml(project.audioFileName)}</p>` : ''}
            </div>
            <div class="mt-3 flex gap-2 justify-between">
                <div class="flex gap-2">
                    <button onclick="uiController.openProject('${project.id}')" 
                            class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                        Review & Edit
                    </button>
                    ${project.transcription ? `
                        <button onclick="uiController.downloadTranscription('${project.id}')" 
                                class="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                            Download
                        </button>
                    ` : ''}
                </div>
                <button onclick="uiController.deleteProject('${project.id}')" 
                        class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        title="Delete Project">
                    🗑️
                </button>
            </div>
        `;
        
        return card;
    }

    // Create project table row
    createProjectTableRow(project) {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 cursor-pointer';
        row.setAttribute('data-project-id', project.id);
        row.onclick = () => this.openProject(project.id);
        
        const statusColors = {
            [CONFIG.PROJECT_STATUS.NEW]: 'bg-blue-100 text-blue-800',
            [CONFIG.PROJECT_STATUS.PROCESSING]: 'bg-yellow-100 text-yellow-800', 
            [CONFIG.PROJECT_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
            [CONFIG.PROJECT_STATUS.NEEDS_REVIEW]: 'bg-orange-100 text-orange-800',
            [CONFIG.PROJECT_STATUS.APPROVED]: 'bg-purple-100 text-purple-800',
            [CONFIG.PROJECT_STATUS.ERROR]: 'bg-red-100 text-red-800'
        };

        const formattedDate = new Date(project.created).toLocaleDateString();
        const audioFileName = project.audioFileName || 'Unknown';
        const assignedTo = project.assignedTo || '-';
        
        // Check if this project is currently being processed
        const isCurrentlyProcessing = this.currentProcessId && this.currentProcessId.includes(project.id);
        
        row.innerHTML = `
            <td class="px-4 py-3 text-sm font-medium text-gray-900 project-name-cell" data-full-name="${UTILS.escapeHtml(project.name)}">
                ${UTILS.escapeHtml(project.name)}
            </td>
            <td class="px-4 py-3 text-sm">
                <span class="table-status-badge ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}">
                    ${project.status}
                </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-500">
                ${formattedDate}
            </td>
            <td class="px-4 py-3 text-sm text-gray-500" title="${UTILS.escapeHtml(audioFileName)}">
                ${UTILS.escapeHtml(audioFileName)}
            </td>
            <td class="px-4 py-3 text-sm text-gray-500" title="${UTILS.escapeHtml(assignedTo)}">
                ${UTILS.escapeHtml(assignedTo)}
            </td>
            <td class="px-4 py-3 text-sm">
                <div class="project-row-actions" onclick="event.stopPropagation();">
                    <button class="project-action-btn btn-edit" onclick="uiController.openProject('${project.id}')" title="Edit">
                        ✏️
                    </button>
                    ${project.transcription ? `
                        <button class="project-action-btn btn-download" onclick="uiController.downloadTranscription('${project.id}')" title="Download">
                            📥
                        </button>
                    ` : ''}
                    <button class="project-action-btn btn-delete" onclick="uiController.deleteProject('${project.id}')" title="Delete">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        
        return row;
    }

    // Update project status in table without full refresh
    updateProjectInTable(projectId, updates) {
        const row = document.querySelector(`tr[data-project-id="${projectId}"]`);
        if (!row) return;    
        
        // Update the status column to show processing indicator
        const statusCell = row.querySelector('td:nth-child(2)');
        if (statusCell && updates.processing) {
            statusCell.innerHTML = `
                <div class="flex items-center space-x-2">
                    <div class="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    <span class="text-blue-600 text-xs">Processing...</span>
                </div>
            `;
        } else if (statusCell && updates.status) {
            const statusColors = {
                [CONFIG.PROJECT_STATUS.NEW]: 'bg-blue-100 text-blue-800',
                [CONFIG.PROJECT_STATUS.PROCESSING]: 'bg-yellow-100 text-yellow-800',
                [CONFIG.PROJECT_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
                [CONFIG.PROJECT_STATUS.NEEDS_REVIEW]: 'bg-orange-100 text-orange-800',
                [CONFIG.PROJECT_STATUS.APPROVED]: 'bg-purple-100 text-purple-800',
                [CONFIG.PROJECT_STATUS.ERROR]: 'bg-red-100 text-red-800'
            };
            
            statusCell.innerHTML = `
                <span class="table-status-badge ${statusColors[updates.status] || 'bg-gray-100 text-gray-800'}">
                    ${updates.status}
                </span>
            `;
        }
    }

    // Show review view with project data
    showReviewView(project) {
        // Update project info
        if (this.elements.reviewProjectInfo) {
            const statusColor = {
                [CONFIG.PROJECT_STATUS.NEW]: 'bg-blue-100 text-blue-800',
                [CONFIG.PROJECT_STATUS.PROCESSING]: 'bg-yellow-100 text-yellow-800',
                [CONFIG.PROJECT_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
                [CONFIG.PROJECT_STATUS.APPROVED]: 'bg-purple-100 text-purple-800',
                [CONFIG.PROJECT_STATUS.ERROR]: 'bg-red-100 text-red-800'
            };
            
            this.elements.reviewProjectInfo.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900">${UTILS.escapeHtml(project.name)}</span>
                    <span class="text-gray-400">•</span>
                    <span class="text-gray-600">${UTILS.escapeHtml(project.assignedTo) || 'Unassigned'}</span>
                    <span class="text-gray-400">•</span>
                    <span class="text-gray-600">${UTILS.escapeHtml(project.audioFileName || 'No audio')}</span>
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColor[project.status] || 'bg-gray-100 text-gray-800'}">
                        ${project.status}
                    </span>
                </div>
            `;
        }

        // Set up audio player
        if (this.elements.reviewAudioPlayer && project.audioUrl) {
            this.elements.reviewAudioPlayer.innerHTML = `
                <audio id="review-audio" controls class="min-w-0">
                    <source src="${project.audioUrl}" type="${project.audioType || 'audio/mpeg'}">
                    Your browser does not support the audio element.
                </audio>
            `;
        } else if (this.elements.reviewAudioPlayer) {
            this.elements.reviewAudioPlayer.innerHTML = `
                <div class="text-gray-400 text-sm">No audio</div>
            `;
        }

        // Set up text editor
        if (this.elements.transcriptionEditor) {
            console.log('📋 Setting up transcription editor with project content');
            // Prioritize richContent (saved rich text HTML), then editedText, then fallbacks
            let content = project.richContent || project.editedText || project.formattedText || project.transcription || '';
            // Check if content has HTML tags, or if it's from richContent (always HTML)
            const hasHTML = project.richContent || /<[^>]*>/.test(content);
            this.setRichTextContent(content, hasHTML);
            
            this.updateWordCount();
            this.updateTranscriptionPreview(); // Initialize preview
        } else {
            console.log('❌ Transcription editor not found');
        }

        // Store current project for review
        this.currentProject = project;

        // Store original text for reset functionality
        this.originalTranscription = project.formattedText || project.transcription || '';
        
        // Show review view
        this.showView('review');
    }

    // Update word and character count
    updateWordCount() {
        // Check if we have a current project first
        if (!this.currentProject || !this.currentProject.id) {
            // Only log once per session to avoid console spam
            if (!this.hasLoggedNoProject) {
                console.log('No current project selected, skipping word count update');
                this.hasLoggedNoProject = true;
            }
            return;
        }
        
        // Reset the logging flag when we have a project
        this.hasLoggedNoProject = false;
        
        const project = projectManager.getProject(this.currentProject.id);
        if (!this.elements.transcriptionEditor) return;
        
        const text = this.getRichTextContent(true); // Get plain text content
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const charCount = text.length;

        if (this.elements.wordCount) {
            this.elements.wordCount.textContent = `${wordCount} words`;
        }
        if (this.elements.characterCount) {
            this.elements.characterCount.textContent = `${charCount} characters`;
        }
    }

    // Approve final version
    approveFinal() {
        console.log('🎯 approveFinal() called');
        
        if (!this.currentProject || !this.elements.transcriptionEditor) {
            console.error('❌ Missing currentProject or transcriptionEditor:', {
                currentProject: !!this.currentProject,
                transcriptionEditor: !!this.elements.transcriptionEditor
            });
            return;
        }
        
        console.log('✅ Current project found:', this.currentProject.name);
        
        const finalText = this.getRichTextContent(true).trim(); // Get plain text
        const richContent = this.getRichTextContent(false); // Get HTML content
        const projectName = UTILS.sanitizeFilename(this.currentProject.name);
        
        console.log('📝 Final text length:', finalText.length);
        
        if (!finalText) {
            this.showErrorMessage('Please enter some text before approving');
            return;
        }
        
        const confirmApprove = confirm('Are you sure you want to approve this transcription as final? This will mark the project as complete.');
        if (!confirmApprove) {
            console.log('❌ User cancelled approval');
            return;
        }
        
        console.log('✅ User confirmed approval, proceeding...');
        
        // Re-apply Pali highlighting to the final text
        const formattedFinalText = this.highlightPaliTerms(finalText);
        try {
            // Update project to approved status
            projectManager.updateProject(this.currentProject.id, {
                editedText: finalText, // Store plain text
                finalText: finalText, // Store plain final text
                richContent: richContent, // Store rich text HTML
                formattedText: formattedFinalText, // Store formatted version for display
                status: CONFIG.PROJECT_STATUS.APPROVED,
                approvedDate: new Date().toISOString(),
                lastEdited: new Date().toISOString()
            });
            
            console.log('✅ Project updated successfully');
            
            this.showSuccessMessage(`Project "${this.currentProject.name}" has been approved and finalized!`);
            console.log('✅ Project approved:', this.currentProject.name);
            
            // Return to dashboard view
            setTimeout(() => {
                this.showView('dashboard');
            }, 2000);
        } catch (error) {
            console.error('❌ Error approving project:', error);
            this.showErrorMessage('Failed to approve project: ' + error.message);
        }
    }

    // Download final transcription
    downloadFinal() {
        if (!this.currentProject || !this.elements.transcriptionEditor) return;
        const finalText = this.getRichTextContent(true); // Get plain text for download
        const richContent = this.getRichTextContent(false); // Get HTML content
        const projectName = UTILS.sanitizeFilename(this.currentProject.name);
        try {
            // Create download blob
            const blob = new Blob([finalText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);

            // Create download link
            const link = document.createElement('a');
            link.href = url;
            link.download = `${projectName}_Final_Transcription.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log('📥 Downloaded final transcription:', link.download);
            this.showSuccessMessage('Final transcription downloaded successfully!');
        } catch (error) {
            console.error('❌ Error downloading transcription:', error);
            this.showErrorMessage('Failed to download transcription: ' + error.message);
        }
    }

    // Setup audio keyboard shortcuts
    setupAudioKeyboardShortcuts() {
        // Remove any existing audio shortcuts
        document.removeEventListener('keydown', this.audioKeyboardHandler);
        
        // Add new audio keyboard handler
        this.audioKeyboardHandler = (e) => {
            // Only work when in review view and not typing in text area
            if (this.currentView !== 'review' || e.target === this.elements.transcriptionEditor) return;
            
            const audio = document.getElementById('review-audio');
            if (!audio) return;
            
            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    if (audio.paused) {
                        audio.play();
                    } else {
                        audio.pause();
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();    
                    audio.currentTime = Math.max(0, audio.currentTime - 10);
                    break;;
                        
                case 'ArrowRight':
                    e.preventDefault();
                    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
                    break;
            }
        };
        
        document.addEventListener('keydown', this.audioKeyboardHandler);
    }

    // Initialize Rich Text Editor
    initializeRichTextEditor() {
        console.log('🎨 Initializing Rich Text Editor...');
        const toolbar = document.getElementById('editor-toolbar');
        const editor = this.elements.transcriptionEditor;
        const toggleSourceBtn = document.getElementById('toggle-source');
        const sourceEditor = document.getElementById('transcription-source');

        console.log('🔍 Rich Text Editor elements:', {
            toolbar: !!toolbar,
            editor: !!editor,
            toggleSourceBtn: !!toggleSourceBtn,
            sourceEditor: !!sourceEditor
        });

        if (!toolbar || !editor) {
            console.error('❌ Rich Text Editor initialization failed - missing elements');
            return;
        }

        console.log('✅ Rich Text Editor elements found, setting up...');
        this.isSourceMode = false;

        // Toolbar button handlers
        toolbar.addEventListener('click', (e) => {
            console.log('🖱️ Toolbar clicked:', e.target);
            if (e.target.classList.contains('toolbar-btn') || e.target.classList.contains('toolbar-btn-sm') || e.target.closest('.toolbar-btn') || e.target.closest('.toolbar-btn-sm')) {
                e.preventDefault();
                const btn = (e.target.classList.contains('toolbar-btn') || e.target.classList.contains('toolbar-btn-sm')) ? e.target : (e.target.closest('.toolbar-btn') || e.target.closest('.toolbar-btn-sm'));
                const command = btn.getAttribute('data-command');
                console.log('🎯 Executing toolbar command:', command);
                if (command && command !== 'removeFormat') {
                    this.executeCommand(command, null);
                } else if (command === 'removeFormat') {
                    this.executeCommand('removeFormat', null);
                } else if (command === 'unlink') {
                    // Special case for unlinking (removing link)
                    this.executeCommand('unlink', null);
                }
                this.updateToolbarState();
            }
        });

        // Select dropdown handler
        toolbar.addEventListener('change', (e) => {
            if (e.target.classList.contains('toolbar-select') || e.target.classList.contains('toolbar-select-sm')) {
                e.preventDefault();
                const command = e.target.getAttribute('data-command');
                const value = e.target.value;
                if (command === 'formatBlock') {
                    this.executeCommand(command, value === 'div' ? 'p' : value);
                }
                this.updateToolbarState();
            }
        });

        // Toggle source mode
        if (toggleSourceBtn) {
            toggleSourceBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSourceMode();
            });
        }

        // Update toolbar state on editor selection changes
        editor.addEventListener('mouseup', () => this.updateToolbarState());
        editor.addEventListener('keyup', () => this.updateToolbarState());

        // Handle keyboard shortcuts
        editor.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        this.executeCommand('bold');
                        this.updateToolbarState();
                        break;
                    case 'i':
                        e.preventDefault();
                        this.executeCommand('italic');
                        this.updateToolbarState();
                        break;
                    case 'u':
                        e.preventDefault();
                        this.executeCommand('underline');
                        this.updateToolbarState();
                        break;
                }    
            }
        });

        // Prevent paste from bringing in unwanted formatting by default
        editor.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            this.executeCommand('insertText', text);
        });
    }

    // Toggle between rich text and HTML source mode
    toggleSourceMode() {
        const editor = this.elements.transcriptionEditor;
        const sourceEditor = document.getElementById('transcription-source');
        const toggleBtn = document.getElementById('toggle-source');

        if (!editor || !sourceEditor) return;

        this.isSourceMode = !this.isSourceMode;
        if (this.isSourceMode) {
            // Switch to source mode
            sourceEditor.value = editor.innerHTML;
            editor.classList.add('hidden');
            sourceEditor.classList.remove('hidden');
            toggleBtn.textContent = 'Visual';
            toggleBtn.title = 'Switch to Visual Editor';
        } else {
            // Switch to visual mode
            editor.innerHTML = sourceEditor.value;
            sourceEditor.classList.add('hidden');
            editor.classList.remove('hidden');                
            toggleBtn.textContent = 'Source';
            toggleBtn.title = 'Toggle HTML Source';
        }
        
        // Update preview after switching back
        this.updateTranscriptionPreview();
    }

    // Execute rich text command
    executeCommand(command, value = null) {
        try {
            console.log('🎯 Executing toolbar command:', command);
            
            // Ensure the editor is focused
            if (this.elements.transcriptionEditor) {
                this.elements.transcriptionEditor.focus();
            }
            
            // Check if we have a text selection
            const selection = window.getSelection();
            const hasSelection = selection && !selection.isCollapsed;
            console.log(`📝 Selection info: hasSelection=${hasSelection}, text="${selection.toString()}"`);
            
            // Try modern approach first, then fall back to execCommand
            let success = false;
            
            if (hasSelection && ['bold', 'italic', 'underline'].includes(command)) {
                // Try modern approach for basic formatting
                success = this.applyModernFormatting(command, selection);
            }
            
            // Fallback to execCommand if modern approach didn't work
            if (!success) {
                success = document.execCommand(command, false, value);
            }
            
            if (success) {
                console.log('✅ Command executed successfully:', command);
                
                // Log the resulting HTML to see what was actually created
                if (this.elements.transcriptionEditor) {
                    const currentHTML = this.elements.transcriptionEditor.innerHTML;
                    console.log('📄 Editor HTML after command:', currentHTML.substring(0, 200) + '...');
                }
                
                // Check command state to see if it's actually active
                const isActive = document.queryCommandState(command);
                console.log(`🔍 Command "${command}" is now active: ${isActive}`);
                
                // Update toolbar state immediately to show active buttons
                this.updateToolbarState();
                
                // Debounced update to avoid excessive calls
                clearTimeout(this.commandUpdateTimeout);
                this.commandUpdateTimeout = setTimeout(() => {
                    try {
                        this.updateTranscriptionPreview();
                        this.updateWordCount();
                    } catch (error) {
                        console.error('Error updating after command execution:', error);
                    }
                }, 100); // Slightly longer delay to batch updates
            } else {
                console.warn('⚠️ Command execution may have failed:', command);
            }
        } catch (error) {
            console.error('❌ Error executing command:', command, error);
        }
    }
    
    // Modern formatting approach using DOM manipulation
    applyModernFormatting(command, selection) {
        try {
            const range = selection.getRangeAt(0);
            const selectedText = range.toString();
            
            if (!selectedText) {
                return false; // No text selected, let execCommand handle it
            }
            
            // Create the appropriate formatting element
            let formatElement;
            switch (command) {
                case 'bold':
                    formatElement = document.createElement('strong');
                    break;
                case 'italic':
                    formatElement = document.createElement('em');
                    break;
                case 'underline':
                    formatElement = document.createElement('u');
                    break;
                default:
                    return false;
            }
            
            // Check if the selection is already formatted
            let parentElement = range.commonAncestorContainer;
            if (parentElement.nodeType === Node.TEXT_NODE) {
                parentElement = parentElement.parentElement;
            }
            
            // If already formatted with the same tag, remove formatting
            if (parentElement && parentElement.tagName && parentElement.tagName.toLowerCase() === formatElement.tagName.toLowerCase()) {
                const textNode = document.createTextNode(parentElement.textContent);
                parentElement.parentNode.replaceChild(textNode, parentElement);
                console.log('🔄 Removed existing formatting');
                return true;
            }
            
            // Apply new formatting
            formatElement.textContent = selectedText;
            range.deleteContents();
            range.insertNode(formatElement);
            
            // Clear selection and position cursor after the formatted text
            selection.removeAllRanges();
            const newRange = document.createRange();
            newRange.setStartAfter(formatElement);
            newRange.collapse(true);
            selection.addRange(newRange);
            
            console.log(`✅ Applied ${command} formatting using modern DOM approach`);
            return true;
            
        } catch (error) {
            console.error('❌ Modern formatting failed:', error);
            return false;
        }
    }

    // Update toolbar button states
    updateToolbarState() {
        const toolbar = document.getElementById('editor-toolbar');
        if (!toolbar) return;
        
        const commands = ['bold', 'italic', 'underline'];
        commands.forEach(command => {
            const btn = toolbar.querySelector(`[data-command="${command}"]`);
            if (btn) {
                if (document.queryCommandState(command)) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });

        // Update format dropdown (both sizes)
        const formatSelect = toolbar.querySelector('[data-command="formatBlock"]');
        if (formatSelect) {
            const formatValue = document.queryCommandValue('formatBlock');
            if (formatValue) {
                formatSelect.value = formatValue.toLowerCase();
            } else {
                formatSelect.value = 'div';
            }
        }
    }

    // Get rich text content (HTML or plain text)
    getRichTextContent(asPlainText = false) {
        const editor = this.elements.transcriptionEditor;
        const sourceEditor = document.getElementById('transcription-source');

        if (!editor) return '';

        if (this.isSourceMode && sourceEditor) {
            return asPlainText ? sourceEditor.value.replace(/<[^>]*>/g, '') : sourceEditor.value;
        } else {
            return asPlainText ? editor.textContent : editor.innerHTML;
        }
    }

    // Set rich text content
    setRichTextContent(content, isHTML = false) {
        const editor = this.elements.transcriptionEditor;
        const sourceEditor = document.getElementById('transcription-source');

        if (!editor) return;

        if (isHTML) {
            editor.innerHTML = content;
            if (sourceEditor) {
                sourceEditor.value = content;
            }
        } else {
            // Plain text
            editor.textContent = content;
            if (sourceEditor) {
                sourceEditor.value = this.escapeHtml(content);
            }
        }
    }

    // Escape HTML characters
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Update transcription preview (placeholder method to prevent errors)
    updateTranscriptionPreview() {
        // This method is called to update any transcription preview elements
        // Currently a placeholder to prevent runtime errors
        // Can be extended in the future if preview functionality is needed
        try {
            // If there's a preview element, update it
            const previewElement = document.getElementById('transcription-preview');
            if (previewElement && this.elements.transcriptionEditor) {
                const content = this.getRichTextContent(false); // Get HTML content
                previewElement.innerHTML = content;
            }
        } catch (error) {
            console.log('Error updating transcription preview:', error);
        }
    }

    // Initialize DOM elements

    // Add table sorting functionality
    initTableSorting() {
        const headers = document.querySelectorAll('.projects-table th[data-column]');
        headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                const column = header.dataset.column;
                this.sortTable(column);
            });
        });
    }

    sortTable(column) {
        // Toggle sort direction
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        this.sortColumn = column;

        const projects = projectManager.getAllProjects();
        projects.sort((a, b) => {
            let aVal, bVal;
            switch(column) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'status':
                    aVal = a.status;
                    bVal = b.status;
                    break;
                case 'created':
                    aVal = new Date(a.created);
                    bVal = new Date(b.created);
                    break;
                case 'assigned':
                    aVal = (a.assignedTo || 'ZZZ').toLowerCase(); // Put unassigned at end
                    bVal = (b.assignedTo || 'ZZZ').toLowerCase();
                    break;
                default:
                    return 0;
            }
            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        projectManager.projects = projects;
        this.refreshProjectsList();
        
        // Update header indicators
        document.querySelectorAll('.projects-table th[data-column]').forEach(th => {
            th.classList.remove('sorted-asc', 'sorted-desc');
        });
        const currentHeader = document.querySelector(`th[data-column="${column}"]`);
        if (currentHeader) {
            currentHeader.classList.add(`sorted-${this.sortDirection}`);
        }
    }

    // Add row selection functionality
    initRowSelection() {
        // Add click handler for table rows
        document.addEventListener('click', (e) => {
            const row = e.target.closest('.projects-table tbody tr');
            if (row && !e.target.closest('.project-row-actions')) {
                // Clear previous selections
                document.querySelectorAll('.projects-table tbody tr').forEach(r => {
                    r.classList.remove('selected');
                });
                // Select this row
                row.classList.add('selected');
            }
        });
    }

    // Open project for editing/review
    openProject(projectId) {
        console.log(`🔄 Opening project: ${projectId}`);
        
        try {
            // Get project data
            const project = projectManager.getProject(projectId);
            if (!project) {
                this.showErrorMessage(`Project not found: ${projectId}`);
                return;
            }
            
            console.log('✅ Project found, setting as current project:', project.name);
            
            // Set current project (this is essential for approveFinal to work)
            this.currentProject = project;
            
            // Store current project ID for compatibility
            this.currentProjectId = projectId;
            
            // Use the existing showReviewView method which properly sets everything up
            this.showReviewView(project);
            
        } catch (error) {
            console.error('❌ Error opening project:', error);
            this.showErrorMessage(`Error opening project: ${error.message}`);
        }
    }

    // Load project data into the review view
    loadProjectIntoReviewView(project) {
        console.log(`📄 Loading project into review view:`, project.id);
        
        try {
            // Update project info display
            if (this.elements.reviewProjectInfo) {
                this.elements.reviewProjectInfo.innerHTML = `
                    <div class="flex items-center space-x-4 text-sm">
                        <div><span class="font-medium">${UTILS.escapeHtml(project.name)}</span></div>
                        <div class="text-gray-500">•</div>
                        <div>Status: <span class="font-medium">${project.status}</span></div>
                        <div class="text-gray-500">•</div>
                        <div>Created: ${new Date(project.created).toLocaleDateString()}</div>
                        ${project.assignedTo ? `
                            <div class="text-gray-500">•</div>
                            <div>Assigned: <span class="font-medium">${UTILS.escapeHtml(project.assignedTo)}</span></div>
                        ` : ''}
                    </div>
                `;
            }
            
            // Load transcription into editor if available
            if (this.elements.transcriptionEditor) {
                this.elements.transcriptionEditor.textContent = project.transcription || '';
            }
            
            // Update preview
            if (this.elements.transcriptionPreview) {
                this.elements.transcriptionPreview.innerHTML = project.transcription || 
                    '<div class="text-gray-400 italic text-center py-20"><div class="text-4xl mb-2">👁️</div><div>Preview will appear here as you edit...</div></div>';
            }
            
        } catch (error) {
            console.error('❌ Error loading project into review view:', error);
            this.showErrorMessage(`Error loading project: ${error.message}`);
        }
    }

    // Show transcription processing modal instead of background processing
    showTranscriptionModal(projectId, audioFile, previewMode, projectName) {
        console.log('🎬 Showing transcription modal for project:', projectId);
        
        // Calculate file size and time estimates
        const fileSizeMB = audioFile.size / (1024 * 1024);
        const timeEstimate = this.getProcessingTimeEstimate(fileSizeMB, previewMode);
        
        // Simple HTML escaping function
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        // Show warning for large files
        let warningSection = '';
        if (fileSizeMB > 25 && !previewMode) {
            warningSection = `
                <div class="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                    <div class="flex">
                        <div class="text-yellow-500 mr-2">⚠️</div>
                        <div class="text-sm text-yellow-800">
                            <strong>Large file detected:</strong> ${fileSizeMB.toFixed(1)}MB<br>
                            This may take <strong>${timeEstimate}</strong> to process.
                            <br><small>Keep this tab open and the computer awake.</small>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Create modal HTML
        const modalHTML = `
            <div id="transcription-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div class="text-center">
                        <div class="text-4xl mb-4">🎤</div>
                        <h3 class="text-lg font-semibold mb-2">Processing Audio</h3>
                        <p class="text-gray-600 mb-2">Transcribing "${escapeHtml(projectName)}"</p>
                        <p class="text-xs text-gray-500 mb-4">${fileSizeMB.toFixed(1)}MB • Est: ${timeEstimate}</p>
                        ${warningSection}
                        <div class="flex items-center justify-center space-x-2 mb-4">
                            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span class="text-blue-600 text-sm" id="processing-status">Processing audio...</span>
                        </div>
                        <div id="transcription-progress" class="text-xs text-gray-500 mb-4">
                            ${previewMode ? 'Preview mode: Processing first 60 seconds' : 'Full transcription in progress'}
                        </div>
                        <button id="cancel-transcription" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add cancel handler
        const cancelBtn = document.getElementById('cancel-transcription');
        const modal = document.getElementById('transcription-modal');
        let isCancelled = false;
        
        const cleanup = () => {
            if (modal) {
                modal.remove();
            }
        };
        
        cancelBtn?.addEventListener('click', () => {
            console.log('🛑 Transcription cancelled by user');
            isCancelled = true;
            cleanup();
            
            // Update project status to cancelled/error
            projectManager.updateProject(projectId, {
                status: CONFIG.PROJECT_STATUS.ERROR,
                error: 'Cancelled by user'
            });
            
            this.refreshProjectsList();
            this.showNotification('Transcription cancelled', 'info', 3000);
        });
        
        // Start the actual transcription process
        this.processProjectAudioWithModal(projectId, audioFile, previewMode, cleanup, () => isCancelled);
    }

    // Process audio with modal feedback and real progress tracking
    async processProjectAudioWithModal(projectId, audioFile, previewMode, cleanup, isCancelledCallback = () => false) {
        let timer = null; // Declare timer at method scope
        
        try {
            // Check for cancellation at each step
            if (isCancelledCallback()) return;
            
            // Update modal status
            const progressEl = document.getElementById('transcription-progress');
            const statusEl = document.getElementById('processing-status');
            
            if (statusEl) statusEl.textContent = 'Initializing...';
            if (progressEl) progressEl.textContent = 'Starting transcription process...';
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (isCancelledCallback()) return;
            
            // Try real backend transcription
            let transcriptionResult = null;
            let backendError = null;
            
            try {
                if (statusEl) statusEl.textContent = 'Connecting to Whisper backend...';
                if (progressEl) progressEl.textContent = 'Checking backend availability...';
                
                if (isCancelledCallback()) return;
                
                // Try direct transcription
                if (statusEl) statusEl.textContent = 'Uploading audio file...';
                if (progressEl) progressEl.textContent = 'Sending audio to backend...';
                
                // Skip audio duration detection to prevent hanging
                const targetDuration = previewMode ? 60 : 'unknown';
                
                if (progressEl) progressEl.textContent = `Audio: ${targetDuration}s ${previewMode ? '(preview)' : '(full)'}`;
                
                // Backend transcription attempt with correct parameters
                const formData = new FormData();
                formData.append('audio', audioFile);
                formData.append('model', 'medium');
                formData.append('language', 'English');
                formData.append('preview', previewMode ? 'true' : 'false');
                if (previewMode) {
                    formData.append('preview_duration', '60'); // Backend expects 'preview_duration'
                }
                
                console.log('📤 Sending to backend:', {
                    filename: audioFile.name,
                    size: audioFile.size,
                    preview: previewMode,
                    duration: previewMode ? 60 : 'full'
                });
                
                if (statusEl) statusEl.textContent = 'Processing with Whisper...';
                if (progressEl) progressEl.textContent = `Transcribing ${targetDuration}s of audio...`;
                
                const startTime = Date.now();
                console.log('🚀 Starting fetch request to backend...');
                
                // Add a timeout based on file size
                const fileSizeMB = audioFile.size / (1024 * 1024);
                const estimatedMinutes = previewMode ? 5 : Math.max(30, fileSizeMB * 1.5);
                const timeoutMs = estimatedMinutes * 60 * 1000;
                
                // Start a timer to update elapsed time in the modal
                timer = setInterval(() => {
                    if (isCancelledCallback()) {
                        clearInterval(timer);
                        return;
                    }
                    
                    const elapsed = Math.floor((Date.now() - startTime) / 1000);
                    const minutes = Math.floor(elapsed / 60);
                    const seconds = elapsed % 60;
                    const elapsedStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    
                    if (progressEl) {
                        const estimatedStr = previewMode ? '2-5 min' : `~${Math.ceil(estimatedMinutes)}min`;
                        progressEl.textContent = `Processing... ${elapsedStr} elapsed (Est: ${estimatedStr})`;
                    }
                }, 1000);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    console.log('⏰ Request timed out, aborting...');
                    controller.abort();
                }, timeoutMs);
                
                // Start transcription with timeout and abort controller
                let response;
                try {
                    console.log('📡 Making fetch request...');
                    response = await fetch(CONFIG.WHISPER_BACKEND.URL, {
                        method: 'POST',
                        body: formData,
                        signal: controller.signal
                    });
                    console.log('📡 Fetch request completed:', response.status);
                    clearTimeout(timeoutId);
                } catch (fetchError) {
                    clearTimeout(timeoutId);
                    clearInterval(timer); // Stop elapsed time updates
                    if (fetchError.name === 'AbortError') {
                        throw new Error('Request timed out');
                    }
                    throw fetchError;
                }
                
                // Check for cancellation before processing response
                if (isCancelledCallback()) {
                    console.log('🛑 Processing cancelled during request');
                    return;
                }
                
                    console.log('📥 Processing response...');
                    if (response.ok) {
                        console.log('✅ Response OK, parsing JSON...');
                        clearInterval(timer); // Stop elapsed time updates
                        const result = await response.json();
                        console.log('🎯 Backend response:', result);
                        
                        // Check if the backend returned an error
                        if (result.success === false) {
                            console.error('❌ Backend returned error:', result.error);
                            throw new Error(result.error || 'Unknown backend error');
                        }
                        
                        transcriptionResult = result.transcription || result.text;
                        
                        if (!transcriptionResult) {
                            console.error('❌ No transcription in response');
                            throw new Error('No transcription received from backend');
                        }
                        
                        const processingTime = Math.round((Date.now() - startTime) / 1000);
                        const wordCount = result.word_count || (transcriptionResult ? transcriptionResult.split(/\s+/).length : 0);
                        
                        console.log('📊 Transcription stats:', {
                            wordCount,
                            processingTime,
                            previewMode: result.preview_mode,
                            textLength: transcriptionResult.length
                        });
                        
                        if (statusEl) statusEl.textContent = 'Transcription completed!';
                        if (progressEl) {
                            const modeText = result.preview_mode ? ` (${result.preview_duration}s preview)` : ' (full audio)';
                            progressEl.textContent = `${wordCount} words transcribed in ${processingTime}s${modeText}`;
                        }
                        
                        console.log('✅ Backend transcription successful');
                    } else {
                        clearInterval(timer); // Stop elapsed time updates
                        console.error('❌ HTTP error:', response.status, response.statusText);
                        const errorText = await response.text();
                        console.error('❌ Error text:', errorText);
                        throw new Error(`Backend error: ${response.status} - ${errorText}`);
                    }
                
            } catch (error) {
                clearInterval(timer); // Stop elapsed time updates
                backendError = error;
                console.log('Backend not available, using mock transcription:', error.message);
                
                // Backend failed, use enhanced mock transcription
                if (statusEl) statusEl.textContent = 'Backend unavailable - generating sample...';
                if (progressEl) progressEl.textContent = 'Creating mock transcription for testing...';
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                if (isCancelledCallback()) return;
                
                // Create more realistic mock transcription based on file
                const fileName = audioFile.name.replace(/\.[^/.]+$/, "");
                const duration = previewMode ? '60 seconds' : 'full duration';
                
                transcriptionResult = `[Sample Transcription for "${fileName}"]

This is a sample transcription generated for ${duration} of your audio file.

In a real scenario, this would contain the actual transcribed text from your audio. The transcription would include:

• Spoken words converted to text
• Proper punctuation and formatting  
• Paragraph breaks for natural speech flow
• Highlighted Pali terms if detected

Note: To get real transcription, please start the Whisper backend server.

Audio file: ${audioFile.name}
File size: ${(audioFile.size / 1024 / 1024).toFixed(2)} MB
Mode: ${previewMode ? 'Preview (60 seconds)' : 'Full transcription'}
Processed: ${new Date().toLocaleString()}`;
            }
            
            if (isCancelledCallback()) return;
            
            if (statusEl) statusEl.textContent = 'Saving transcription...';
            if (progressEl) progressEl.textContent = 'Updating project...';
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Update project with transcription
            projectManager.updateProject(projectId, {
                transcription: transcriptionResult,
                status: CONFIG.PROJECT_STATUS.NEEDS_REVIEW,
                audioFileName: audioFile.name,
                processedWithBackend: !backendError
            });
            
            // Clean up modal
            cleanup();
            
            // Clear timer
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
            
            // Refresh the projects list to show updated status
            this.refreshProjectsList();
            
            // Show success message
            const project = projectManager.getProject(projectId);
            const backendNote = backendError ? ' (Sample transcription - start Whisper server for real transcription)' : ' (Real transcription)';
            this.showSuccessMessage(`Transcription completed for "${project.name}"${backendNote}`);
            
        } catch (error) {
            console.error('❌ Error in transcription process:', error);
            cleanup();
            
            // Clear timer
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
            
            // Update project status to error
            projectManager.updateProject(projectId, {
                status: CONFIG.PROJECT_STATUS.ERROR,
                error: error.message
            });
            
            this.refreshProjectsList();
            this.showErrorMessage(`Transcription failed: ${error.message}`);
        }
    }

    // Show file size information and warnings
    showFileSizeInfo(file) {
        const fileSizeMB = file.size / (1024 * 1024);
        const fileSizeFormatted = fileSizeMB < 1 
            ? `${(file.size / 1024).toFixed(1)} KB` 
            : `${fileSizeMB.toFixed(1)} MB`;
        
        console.log(`📁 Selected file: ${file.name} (${fileSizeFormatted})`);
        
        // Show warnings and time estimates for larger files
        if (fileSizeMB > 10) {
            const estimatedMinutes = Math.max(15, Math.ceil(fileSizeMB * 1.5));
            const timeEstimate = estimatedMinutes > 60 
                ? `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m`
                : `${estimatedMinutes}m`;
            
            let warningMessage = `Large file detected: ${fileSizeFormatted}`;
            let warningType = 'info';
            
            if (fileSizeMB > 50) {
                warningMessage = `⚠️ Very large file: ${fileSizeFormatted}<br>` +
                    `<strong>Estimated processing time: ~${timeEstimate}</strong><br>` +
                    `Consider using Preview Mode for testing, or ensure you have time for full processing.`;
                warningType = 'error';
            } else if (fileSizeMB > 25) {
                warningMessage = `Large file: ${fileSizeFormatted}<br>` +
                    `<strong>Estimated processing time: ~${timeEstimate}</strong><br>` +
                    `Processing may take a while. Consider using Preview Mode first.`;
                warningType = 'error';
            } else {
                warningMessage = `Medium file: ${fileSizeFormatted} - Estimated processing time: ~${timeEstimate}`;
            }
            
            this.showNotification(warningMessage, warningType, 8000, true);
        }
    }

    // Get estimated processing time for a file
    getProcessingTimeEstimate(fileSizeMB, isPreview = false) {
        if (isPreview) {
            return "2-5 minutes"; // Preview is always fast
        }
        
        const estimatedMinutes = Math.max(15, Math.ceil(fileSizeMB * 1.5));
        if (estimatedMinutes > 60) {
            const hours = Math.floor(estimatedMinutes / 60);
            const minutes = estimatedMinutes % 60;
            return `${hours}h ${minutes}m`;
        }
        return `${estimatedMinutes}m`;
    }

    // Backend status checking methods
    async checkAndUpdateBackendStatus() {
        console.log('🔍 Checking backend status...');
        try {
            // Simple backend status check
            if (this.elements.backendStatusIndicator && this.elements.backendStatusText) {
                this.elements.backendStatusIndicator.className = 'w-3 h-3 rounded-full bg-yellow-400 animate-pulse';
                this.elements.backendStatusText.textContent = 'Checking backend status...';
                
                const isAvailable = await this.checkWhisperBackendAvailable();
                
                if (isAvailable) {
                    this.elements.backendStatusIndicator.className = 'w-3 h-3 rounded-full bg-green-500';
                    this.elements.backendStatusText.textContent = 'Whisper backend is running ✅';
                    if (this.elements.backendInstructions) {
                        this.elements.backendInstructions.classList.add('hidden');
                    }
                } else {
                    this.elements.backendStatusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
                    this.elements.backendStatusText.textContent = 'Whisper backend not running (will use demo mode)';
                    if (this.elements.backendInstructions) {
                        this.elements.backendInstructions.classList.remove('hidden');
                    }
                }
            }
        } catch (error) {
            console.error('Error checking backend status:', error);
            if (this.elements.backendStatusIndicator && this.elements.backendStatusText) {
                this.elements.backendStatusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
                this.elements.backendStatusText.textContent = 'Cannot connect to backend (will use demo mode)';
            }
        }
    }

    async checkWhisperBackendAvailable() {
        try {
            const response = await fetch(`${CONFIG.WHISPER.BACKEND_URL}/health`, {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            console.log('Backend not available:', error.message);
            return false;
        }
    }

    async autoStartWhisperBackend() {
        console.log('🚀 Auto-starting Whisper backend...');
        // This is a placeholder method for auto-starting the backend
        // In practice, this would trigger the backend startup process
        try {
            await this.checkAndUpdateBackendStatus();
        } catch (error) {
            console.error('Error auto-starting backend:', error);
        }
    }

    // Modal handling methods
    showNewProjectModal() {
        console.log('📋 Showing new project modal');
        if (this.elements.newProjectModal) {
            this.elements.newProjectModal.classList.remove('hidden');
            // Focus on project name input
            if (this.elements.projectName) {
                setTimeout(() => this.elements.projectName.focus(), 100);
            }
        }
    }

    hideNewProjectModal() {
        console.log('📋 Hiding new project modal');
        if (this.elements.newProjectModal) {
            this.elements.newProjectModal.classList.add('hidden');
        }
    }

    // Project filtering and view management methods
    refreshReviewProjectsList() {
        console.log('🔄 Refreshing Ready for Review projects list');
        const projects = projectManager.getAllProjects();
        const reviewProjects = projects.filter(project => project.status === CONFIG.PROJECT_STATUS.NEEDS_REVIEW);
        this.populateProjectsTable(reviewProjects, 'review');
    }

    refreshApprovedProjectsList() {
        console.log('🔄 Refreshing Approved projects list');
        const projects = projectManager.getAllProjects();
        const approvedProjects = projects.filter(project => project.status === CONFIG.PROJECT_STATUS.APPROVED);
        this.populateProjectsTable(approvedProjects, 'approved');
    }

    // Clear projects by status with confirmation
    clearProjectsByStatus(status) {
        console.log(`🗑️ Clear projects with status: ${status} requested`);
        
        const projects = projectManager.getAllProjects();
        const filteredProjects = projects.filter(project => project.status === CONFIG.PROJECT_STATUS[status]);
        
        if (filteredProjects.length === 0) {
            const statusName = status === 'NEEDS_REVIEW' ? 'ready for review' : 'approved';
            this.showSuccessMessage(`No ${statusName} projects to clear`);
            return;
        }
        
        const statusName = status === 'NEEDS_REVIEW' ? 'ready for review' : 'approved';
        const confirmed = confirm(`Are you sure you want to delete all ${filteredProjects.length} ${statusName} projects? This action cannot be undone.`);
        
        if (confirmed) {
            try {
                filteredProjects.forEach(project => {
                    projectManager.deleteProject(project.id);
                });
                
                // Refresh the appropriate view
                if (status === 'NEEDS_REVIEW') {
                    this.refreshReviewProjectsList();
                } else if (status === 'APPROVED') {
                    this.refreshApprovedProjectsList();
                }
                
                this.showSuccessMessage(`All ${filteredProjects.length} ${statusName} projects have been deleted`);
                console.log(`✅ All ${statusName} projects cleared successfully`);
            } catch (error) {
                console.error(`❌ Error clearing ${statusName} projects:`, error);
                this.showErrorMessage(`Error clearing ${statusName} projects: ${error.message}`);
            }
        }
    }

    // Enhanced debounced search that supports view-specific filtering
    debouncedSearch(searchTerm, viewType = 'all') {
        clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(() => {
            console.log(`🔍 Searching for: "${searchTerm}" in view: ${viewType}`);
            
            let projects;
            if (viewType === 'review') {
                projects = projectManager.getAllProjects().filter(p => p.status === CONFIG.PROJECT_STATUS.NEEDS_REVIEW);
            } else if (viewType === 'approved') {
                projects = projectManager.getAllProjects().filter(p => p.status === CONFIG.PROJECT_STATUS.APPROVED);
            } else {
                projects = projectManager.getAllProjects();
            }
            
            const filteredProjects = this.filterProjectsBySearch(projects, searchTerm);
            this.populateProjectsTable(filteredProjects, viewType);
        }, 300);
    }

    // Filter projects based on search term
    filterProjectsBySearch(projects, searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            return projects;
        }

        const term = searchTerm.toLowerCase();
        return projects.filter(project => 
            project.name.toLowerCase().includes(term) ||
            (project.assignedTo && project.assignedTo.toLowerCase().includes(term)) ||
            project.status.toLowerCase().includes(term)
        );
    }

    // Enhanced populate table method that supports different views
    populateProjectsTable(projects, viewType = 'all') {
        console.log(`📊 Populating projects table for view: ${viewType} with ${projects.length} projects`);
        
        let tableBody, emptyState;
        
        // Determine which table body and empty state to use
        switch (viewType) {
            case 'review':
                tableBody = this.elements.reviewProjectsTableBody;
                emptyState = this.elements.emptyReviewState;
                break;
            case 'approved':
                tableBody = this.elements.approvedProjectsTableBody;
                emptyState = this.elements.emptyApprovedState;
                break;
            default:
                tableBody = this.elements.projectsTableBody;
                emptyState = this.elements.emptyProjectsState;
        }
        
        if (!tableBody) {
            console.error(`❌ Table body not found for view: ${viewType}`);
            return;
        }

        // Clear existing content
        tableBody.innerHTML = '';

        // Handle empty state
        if (projects.length === 0) {
            if (emptyState) {
                emptyState.classList.remove('hidden');
            }
            return;
        }

        // Hide empty state
        if (emptyState) {
            emptyState.classList.add('hidden');
        }

        // Sort projects by created date (newest first)
        const sortedProjects = [...projects].sort((a, b) => 
            new Date(b.created) - new Date(a.created)
        );

        // Generate table rows
        sortedProjects.forEach(project => {
            const row = this.createProjectTableRow(project);
            tableBody.appendChild(row);
        });

        console.log(`✅ Table populated with ${projects.length} projects for view: ${viewType}`);
    }

    // ...existing code...
}
// Initialize UI Controller when page loads
let uiController;
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 Initializing UI Controller...');
    uiController = new UIController();
    console.log('✅ UI Controller initialized');
});
