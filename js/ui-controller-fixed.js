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
            
            // Transcription modal timer properties
            this.transcriptionTimer = null;
            this.transcriptionStartTime = null;
            this.transcriptionProgress = 0;
            
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
            // Check if we have server-based project manager available
            this.useServerManager = (typeof ServerProjectManager !== 'undefined');
            
            if (this.useServerManager) {
                console.log('✅ Using server-based project manager');
                this.projectManager = new ServerProjectManager();
            } else {
                console.log('⚠️ Server project manager not available, falling back to local manager');
                this.projectManager = window.projectManager || new ProjectManager();
            }
            
            this.cacheElements();
            console.log('✅ Elements cached');
            
            this.bindEvents();
            console.log('✅ Events bound');
            
            this.showView('dashboard');
            console.log('✅ Initial view shown (dashboard)');
            
            this.refreshProjectsList();
            console.log('✅ Projects list refreshed');
            
            this.initTableSorting();
            console.log('✅ Table sorting initialized');
            
            this.initRowSelection();
            console.log('✅ Row selection initialized');
            
            this.initializeRichTextEditor();
            console.log('✅ Rich text editor initialized');
            
            console.log('✅ UIController init completed');
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
            previewMode: document.getElementById('preview-mode'),
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
            btnExportPdf: document.getElementById('btn-export-pdf'),
            btnBackToDashboard: document.getElementById('btn-back-to-dashboard'),

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
            processingStatusBar: document.getElementById('processing-status-bar'),
            processingStatusMessage: document.getElementById('processing-status-message'),
            btnCancelProcessing: document.getElementById('btn-cancel-processing'),
            btnCancelBackgroundProcessing: document.getElementById('btn-cancel-background-processing'),

            // Notifications
            notificationContainer: document.getElementById('notification-container'),
            
            // Cancel processing modal
            cancelProcessingModal: document.getElementById('cancel-processing-modal'),
            confirmCancelProcessing: document.getElementById('confirm-cancel-processing'),
            cancelCancelProcessing: document.getElementById('cancel-cancel-processing'),

            // Transcription progress modal
            transcriptionProgressModal: document.getElementById('transcription-progress-modal'),
            transcriptionProgressMessage: document.getElementById('transcription-progress-message'),
            transcriptionProgressBar: document.getElementById('transcription-progress-bar'),
            transcriptionElapsedTime: document.getElementById('transcription-elapsed-time'),
            transcriptionRemainingTime: document.getElementById('transcription-remaining-time'),
            transcriptionFileInfo: document.getElementById('transcription-file-info'),
            minimizeTranscriptionModal: document.getElementById('minimize-transcription-modal'),
            cancelTranscriptionProcessing: document.getElementById('cancel-transcription-processing'),

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
            this.elements.btnSaveDraft.addEventListener('click', async () => {
                await this.saveDraft();
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

        if (this.elements.btnExportPdf) {
            this.elements.btnExportPdf.addEventListener('click', () => {
                this.exportPdf();
            });
        }

        if (this.elements.btnBackToDashboard) {
            this.elements.btnBackToDashboard.addEventListener('click', () => {
                console.log('🔙 Back to Dashboard button clicked');
                this.showView('dashboard');
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
                this.showCancelProcessingModal();
            });
        }

        if (this.elements.btnCancelBackgroundProcessing) {
            this.elements.btnCancelBackgroundProcessing.addEventListener('click', () => {
                this.showCancelProcessingModal();
            });
        }
        
        // Cancel processing modal buttons
        if (this.elements.confirmCancelProcessing) {
            this.elements.confirmCancelProcessing.addEventListener('click', () => {
                this.confirmCancelProcessing();
            });
        }
        
        if (this.elements.cancelCancelProcessing) {
            this.elements.cancelCancelProcessing.addEventListener('click', () => {
                this.hideCancelProcessingModal();
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

        // Transcription progress modal events
        if (this.elements.minimizeTranscriptionModal) {
            this.elements.minimizeTranscriptionModal.addEventListener('click', () => {
                this.minimizeTranscriptionModal();
            });
        }

        if (this.elements.cancelTranscriptionProcessing) {
            this.elements.cancelTranscriptionProcessing.addEventListener('click', () => {
                this.showCancelProcessingModal();
            });
        }

        // Status bar click to restore modal
        if (this.elements.processingStatusBar) {
            this.elements.processingStatusBar.addEventListener('click', () => {
                this.restoreTranscriptionModal();
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
        
        const projects = this.projectManager.getAllProjects();
        if (projects.length === 0) {
            this.showSuccessMessage('No projects to clear');
            return;
        }
        
        // Show confirmation dialog
        const confirmed = confirm(`Are you sure you want to delete all ${projects.length} projects? This action cannot be undone.`);
        
        if (confirmed) {
            try {
                this.projectManager.clearAllProjects();
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
            // Create project (with automatic name deduplication)
            const project = await this.projectManager.createProject(formData);
            console.log('✅ Project created:', project.id);
            // Reset form and close modal
            this.resetCreateForm();
            this.hideNewProjectModal();
            // Show cancel modal dialog and start processing
            this.showTranscriptionModal(project.id, audioFile, previewMode, formData.name);
        } catch (error) {
            console.error('❌ Error creating project:', error);
            this.hideBackgroundProcessing();
            let errorMessage = error.message;
            if (errorMessage.includes('\n')) {
                errorMessage = errorMessage.replace(/\n/g, '<br>');
            }
            this.showDetailedError('Create Project', errorMessage);
        }
    }

    // Process project audio in background (non-blocking)
    async processProjectAudioBackground(projectId, audioFile, previewMode = false, projectName = '') {
        console.log('🚀 Starting background audio processing for project:', projectId);
        
        // Set the processing project ID for cancellation purposes
        this.processingProjectId = projectId;
        
        // Show background processing UI
        this.showBackgroundProcessing(`Processing ${projectName}...`);
        
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
        } finally {
            // Clear the processing project ID when done
            this.processingProjectId = null;
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
            const uploadResult = await this.projectManager.attachAudioFile(projectId, audioFile, 'local', previewMode);
            console.log('✅ Audio file attached successfully:', uploadResult);
            
            if (!this.isProcessing) {
                // Processing was cancelled
                throw new Error('Processing was cancelled');
            }
            
            // Small delay to ensure database transaction is committed
            console.log('⏳ Waiting for database commit...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Increased to 1 second
            
            // Verify the project has the audio file before proceeding
            console.log('🔍 Verifying project has audio file...');
            await this.projectManager.loadProjects(); // Refresh projects from server
            const updatedProject = this.projectManager.projects.find(p => p.id === projectId);
            console.log('📋 Updated project data:', updatedProject);
            
            if (!updatedProject || (!updatedProject.audioFilePath && !updatedProject.audio_file_path)) {
                throw new Error('Audio file was not properly associated with the project. Please try again.');
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
                    this.projectManager.deleteProject(projectId);
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
            // Use the project manager's transcribeProject method for server-based workflow
            console.log('📤 Starting server-based transcription...');
            
            const transcriptionOptions = {
                model: 'medium',
                language: 'English',
                preview: previewMode,
                previewDuration: 60
            };

            const result = await this.projectManager.transcribeProject(projectId, transcriptionOptions);
            
            console.log('✅ Server transcription completed:', result);

            // Check if the transcription was successful
            if (!result.success) {
                throw new Error(result.error || 'Transcription failed');
            }

            const transcription = result.transcription;
            if (!transcription) {
                throw new Error('No transcription received from backend');
            }

            // Update project with transcription results (the server already updated it, but we update UI state)
            const formattedText = this.formatTranscriptionText(transcription);
            console.log('📝 Transcription completed successfully');
            
            // The project manager already updated the server, so we just need to refresh local state
            await this.projectManager.loadProjects();

            return {
                success: true,
                transcription: transcription,
                formattedText: formattedText,
                word_count: result.word_count,
                processing_time: result.processing_time
            };

        } catch (error) {
            console.error('❌ Error in processWithWhisperBackend:', error);
            throw error;
        }
    }

    // Format transcription text with improvements
    formatTranscriptionText(transcription) {
        if (!transcription) return '';
        
        let formatted = transcription.trim();
        
        // Add header indicating this is generated content
        formatted = '=== GENERATED TRANSCRIPTION ===\n\n' + formatted;
        
        // Apply automatic paragraph formatting for longer texts
        formatted = this.addAutomaticParagraphs(formatted);
        
        // Highlight potential Pali terms (words that might be transliterated)
        formatted = this.highlightPaliTerms(formatted);
        
        // Add footer
        formatted += '\n\n=== END TRANSCRIPTION ===';
        
        return formatted;
    }

    // Add intelligent automatic paragraph breaks for longer transcriptions
    addAutomaticParagraphs(text) {
        console.log('📝 Adding automatic paragraphs to text of length:', text.length);
        
        // Skip automatic paragraphing for short texts (less than 500 characters)
        if (text.length < 500) {
            console.log('📝 Text too short for automatic paragraphs, applying basic formatting');
            // Just apply basic sentence break formatting
            return text.replace(/([.!?])\s{2,}/g, '$1\n\n');
        }

        let formatted = text;
        
        // Step 1: Clean up existing formatting
        formatted = formatted.replace(/\n+/g, ' ').trim();
        
        // Step 2: Add paragraph breaks after sentences with strong indicators
        // Discourse markers and transition words that often start new paragraphs
        const paragraphMarkers = [
            'Well', 'So', 'Now', 'Then', 'And then', 'But', 'However', 'Actually', 
            'Furthermore', 'Moreover', 'In addition', 'On the other hand', 
            'Meanwhile', 'Later', 'Afterwards', 'Subsequently', 'Therefore',
            'As a result', 'Consequently', 'In conclusion', 'To summarize',
            'First', 'Second', 'Third', 'Finally', 'Next', 'Previously',
            'For example', 'For instance', 'In other words', 'That is to say',
            'Let me explain', 'To clarify', 'What I mean is', 'In fact',
            'Interestingly', 'Importantly', 'Notably', 'Significantly'
        ];
        
        // Create regex pattern for discourse markers
        const markerPattern = new RegExp(`([.!?])\\s+(${paragraphMarkers.join('|')})\\b`, 'gi');
        formatted = formatted.replace(markerPattern, '$1\n\n$2');
        
        // Step 3: Add breaks after sentences with multiple spaces (indicating pauses)
        formatted = formatted.replace(/([.!?])\s{3,}/g, '$1\n\n');
        
        // Step 4: Add breaks after sentences followed by quotation or direct speech
        formatted = formatted.replace(/([.!?])\s+(["'"'"])/g, '$1\n\n$2');
        
        // Step 5: Add breaks before questions when preceded by statements
        formatted = formatted.replace(/([.!])\s+([A-Z][^.!?]*\?)/g, '$1\n\n$2');
        
        // Step 6: Handle long continuous text by adding breaks at sentence boundaries
        // Split into sentences and group them into reasonable paragraphs
        const sentences = formatted.split(/(?<=[.!?])\s+/);
        const paragraphs = [];
        let currentParagraph = [];
        let currentLength = 0;
        const maxParagraphLength = 400; // characters
        const maxSentencesPerParagraph = 5;
        
        sentences.forEach((sentence, index) => {
            sentence = sentence.trim();
            if (!sentence) return;
            
            // Check if adding this sentence would make paragraph too long
            const wouldBeTooLong = currentLength + sentence.length > maxParagraphLength;
            const tooManySentences = currentParagraph.length >= maxSentencesPerParagraph;
            
            // Start new paragraph if current one is getting too long or has too many sentences
            if ((wouldBeTooLong || tooManySentences) && currentParagraph.length > 0) {
                paragraphs.push(currentParagraph.join(' '));
                currentParagraph = [sentence];
                currentLength = sentence.length;
            } else {
                currentParagraph.push(sentence);
                currentLength += sentence.length + 1; // +1 for space
            }
        });
        
        // Add the last paragraph
        if (currentParagraph.length > 0) {
            paragraphs.push(currentParagraph.join(' '));
        }
        
        // Join paragraphs with double line breaks
        formatted = paragraphs.join('\n\n');
        
        // Step 7: Clean up any triple+ line breaks
        formatted = formatted.replace(/\n{3,}/g, '\n\n');
        
        // Step 8: Ensure proper spacing around the header
        formatted = formatted.replace(/^(=== GENERATED TRANSCRIPTION ===)\s*/, '$1\n\n');
        
        console.log(`📝 Paragraph formatting complete: ${paragraphs.length} paragraphs created`);
        
        return formatted;
    }

    // Apply automatic paragraph formatting to the current editor content
    applyAutoParagraphing() {
        console.log('📝 Applying auto-paragraphing to current editor content');
        
        if (!this.elements.transcriptionEditor) {
            console.error('❌ Transcription editor not found');
            return;
        }

        try {
            // Get current content as plain text
            const currentText = this.elements.transcriptionEditor.textContent || this.elements.transcriptionEditor.innerText || '';
            
            if (!currentText || currentText.trim().length < 100) {
                this.showNotification('Text too short for auto-paragraphing (minimum 100 characters)', 'info', 3000);
                return;
            }

            console.log('📝 Current text length:', currentText.length);

            // Apply the automatic paragraph formatting
            const formattedText = this.addAutomaticParagraphs(currentText);
            
            // Convert the formatted text to HTML with proper paragraph tags
            const htmlContent = this.convertTextToParagraphHTML(formattedText);
            
            // Update the editor content
            this.elements.transcriptionEditor.innerHTML = htmlContent;
            
            // Update preview and word count
            this.updateTranscriptionPreview();
            this.updateWordCount();
            
            // Show success notification
            this.showNotification('Auto-paragraphing applied successfully!', 'success', 3000);
            console.log('✅ Auto-paragraphing applied successfully');
            
        } catch (error) {
            console.error('❌ Error applying auto-paragraphing:', error);
            this.showNotification('Error applying auto-paragraphing: ' + error.message, 'error', 5000);
        }
    }

    // Convert plain text with line breaks to HTML with paragraph tags
    convertTextToParagraphHTML(text) {
        if (!text) return '';
        
        // Split text into paragraphs based on double line breaks
        const paragraphs = text.split(/\n\s*\n/);
        
        // Convert each paragraph to HTML, preserving single line breaks as <br>
        const htmlParagraphs = paragraphs.map(paragraph => {
            paragraph = paragraph.trim();
            if (!paragraph) return '';
            
            // Replace single line breaks with <br> tags
            const formattedParagraph = paragraph.replace(/\n/g, '<br>');
            
            // Wrap in paragraph tags
            return `<p>${formattedParagraph}</p>`;
        }).filter(p => p); // Remove empty paragraphs
        
        return htmlParagraphs.join('\n\n');
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
    // Cancel current processing
    async cancelCurrentProcessing() {
        console.log('🛑 Cancelling current processing...');
        
        try {
            // Extract project ID from currentProcessId or use currentProject
            let projectId = null;
            
            if (this.currentProcessId && this.currentProcessId.includes('process_')) {
                // Try to extract project ID from background processing
                // The processProjectAudioBackground method should set a proper process ID
                if (this.processingProjectId) {
                    projectId = this.processingProjectId;
                }
            } else if (this.currentProject && this.currentProject.id) {
                projectId = this.currentProject.id;
            }
            
            if (projectId) {
                console.log(`🛑 Sending cancel request for project: ${projectId}`);
                this.showNotification('Cancelling transcription...', 'info');
                
                console.log('🔄 Making fetch request to:', `/projects/${projectId}/cancel`);
                
                const response = await fetch(`/projects/${projectId}/cancel`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('📡 Fetch response received:', response);
                console.log('📡 Response status:', response.status);
                console.log('📡 Response ok:', response.ok);
                console.log('📡 Response headers:', response.headers);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Server cancel response:', result);
                    this.showNotification('Transcription cancelled successfully', 'info', 3000);
                } else {
                    const errorText = await response.text();
                    console.error('❌ Server cancel failed:', response.status, errorText);
                    this.showNotification(`Failed to cancel on server (${response.status}): ${errorText}`, 'error', 5000);
                }
            } else {
                console.log('ℹ️ No active project to cancel on server');
                this.showNotification('Stopping local processing...', 'info', 2000);
            }
        } catch (error) {
            console.error('❌ Error cancelling on server:', error);
            this.showNotification('Failed to cancel on server, but stopping UI', 'error', 3000);
        }
        
        // Always clean up local state regardless of server response
        this.isProcessing = false;
        this.currentProcessId = null;
        this.processingProjectId = null; // Clear the processing project ID
        
        this.hideBackgroundProcessing();
    }

    // Background processing UI methods
    showBackgroundProcessing(message) {
        console.log('📝 Starting background processing: ' + message);
        this.showTranscriptionProgressModal(message);
    }

    hideBackgroundProcessing() {
        console.log('📝 Hiding background processing UI');
        this.hideTranscriptionProgressModal();
    }

    updateBackgroundProcessingMessage(message) {
        this.updateTranscriptionProgress(message);
    }

    // New transcription modal methods
    showTranscriptionProgressModal(message = "Processing your audio file...") {
        console.log('🎙️ Showing transcription progress modal');
        
        // Initialize the modal
        this.transcriptionStartTime = Date.now();
        this.transcriptionProgress = 0;
        
        // Reset modal content
        if (this.elements.transcriptionProgressMessage) {
            this.elements.transcriptionProgressMessage.textContent = message;
        }
        if (this.elements.transcriptionProgressBar) {
            this.elements.transcriptionProgressBar.style.width = '0%';
        }
        if (this.elements.transcriptionElapsedTime) {
            this.elements.transcriptionElapsedTime.textContent = '00:00';
        }
        if (this.elements.transcriptionRemainingTime) {
            this.elements.transcriptionRemainingTime.textContent = '--:--';
        }
        
        // Show the modal
        if (this.elements.transcriptionProgressModal) {
            this.elements.transcriptionProgressModal.classList.remove('hidden');
        }
        
        // Start the timer update
        this.startTranscriptionTimer();
    }

    hideTranscriptionProgressModal() {
        console.log('🎙️ Hiding transcription progress modal');
        
        if (this.elements.transcriptionProgressModal) {
            this.elements.transcriptionProgressModal.classList.add('hidden');
        }
        
        // Stop the timer
        this.stopTranscriptionTimer();
    }

    minimizeTranscriptionModal() {
        console.log('🎙️ Minimizing transcription modal to status bar');
        
        // Hide the modal
        this.hideTranscriptionProgressModal();
        
        // Show the old status bar as minimized view
        if (this.elements.processingStatusBar) {
            this.elements.processingStatusBar.classList.remove('hidden');
            if (this.elements.processingStatusMessage) {
                this.elements.processingStatusMessage.textContent = 'Transcribing... (click to restore)';
            }
        }
    }

    restoreTranscriptionModal() {
        console.log('🎙️ Restoring transcription modal from status bar');
        
        // Hide the status bar
        if (this.elements.processingStatusBar) {
            this.elements.processingStatusBar.classList.add('hidden');
        }
        
        // Show the modal
        if (this.elements.transcriptionProgressModal) {
            this.elements.transcriptionProgressModal.classList.remove('hidden');
        }
        
        // Resume the timer if not already running
        if (!this.transcriptionTimer) {
            this.startTranscriptionTimer();
        }
    }

    updateTranscriptionProgress(message, progress = null, fileInfo = null) {
        // Update message
        if (this.elements.transcriptionProgressMessage) {
            this.elements.transcriptionProgressMessage.textContent = message;
        }
        
        // Update progress bar if progress is provided
        if (progress !== null && this.elements.transcriptionProgressBar) {
            this.transcriptionProgress = progress;
            this.elements.transcriptionProgressBar.style.width = `${progress}%`;
        }
        
        // Update file info if provided
        if (fileInfo && this.elements.transcriptionFileInfo) {
            this.elements.transcriptionFileInfo.textContent = fileInfo;
        }
        
        // Update status bar message for minimized view
        if (this.elements.processingStatusMessage) {
            this.elements.processingStatusMessage.textContent = message;
        }
    }

    startTranscriptionTimer() {
        // Clear any existing timer
        this.stopTranscriptionTimer();
        
        this.transcriptionTimer = setInterval(() => {
            this.updateTranscriptionTimer();
        }, 1000);
    }

    stopTranscriptionTimer() {
        if (this.transcriptionTimer) {
            clearInterval(this.transcriptionTimer);
            this.transcriptionTimer = null;
        }
    }

    updateTranscriptionTimer() {
        if (!this.transcriptionStartTime) return;
        
        const elapsedMs = Date.now() - this.transcriptionStartTime;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        // Format elapsed time
        const elapsedMinutes = Math.floor(elapsedSeconds / 60);
        const elapsedSecondsRemainder = elapsedSeconds % 60;
        const elapsedTimeStr = `${elapsedMinutes.toString().padStart(2, '0')}:${elapsedSecondsRemainder.toString().padStart(2, '0')}`;
        
        if (this.elements.transcriptionElapsedTime) {
            this.elements.transcriptionElapsedTime.textContent = elapsedTimeStr;
        }
        
        // Calculate remaining time based on progress
        let remainingTimeStr = '--:--';
        if (this.transcriptionProgress > 5) { // Only estimate after some progress
            const estimatedTotalMs = (elapsedMs / this.transcriptionProgress) * 100;
            const remainingMs = estimatedTotalMs - elapsedMs;
            const remainingSeconds = Math.floor(remainingMs / 1000);
            
            if (remainingSeconds > 0) {
                const remainingMinutes = Math.floor(remainingSeconds / 60);
                const remainingSecondsRemainder = remainingSeconds % 60;
                remainingTimeStr = `${remainingMinutes.toString().padStart(2, '0')}:${remainingSecondsRemainder.toString().padStart(2, '0')}`;
            } else {
                remainingTimeStr = '00:00';
            }
        }
        
        if (this.elements.transcriptionRemainingTime) {
            this.elements.transcriptionRemainingTime.textContent = remainingTimeStr;
        }
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
    async refreshProjectsList() {
        try {
            // Refresh projects (server or local)
            if (this.useServerManager) {
                await this.projectManager.loadProjects();
            }
            const projects = this.projectManager.getAllProjects();
            
            // Update table view (primary)
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
        } catch (error) {
            console.error('❌ Error refreshing projects:', error);
            this.showErrorMessage('Failed to refresh projects');
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
        console.log('🎵 Setting up audio player for project:', project.name);
        console.log('🎵 Project audioUrl:', project.audioUrl);
        console.log('🎵 Project audioFile:', project.audioFile);
        console.log('🎵 reviewAudioPlayer element:', this.elements.reviewAudioPlayer);
        
        if (this.elements.reviewAudioPlayer) {
            // Check if we have an audioUrl, if not try to create one from audioFile
            let audioUrl = project.audioUrl;
            
            if (!audioUrl && project.audioFile) {
                console.log('🎵 Regenerating audio URL from stored file');
                audioUrl = URL.createObjectURL(project.audioFile);
                // Update the project with the new URL
                this.projectManager.updateProject(project.id, { audioUrl: audioUrl });
            }
            
            if (audioUrl) {
                console.log('🎵 Creating audio player with URL:', audioUrl);
                this.elements.reviewAudioPlayer.innerHTML = `
                    <audio id="review-audio" controls class="min-w-0 max-w-sm">
                        <source src="${audioUrl}" type="${project.audioType || 'audio/mpeg'}">
                        Your browser does not support the audio element.
                    </audio>
                `;
                
                // Set up keyboard shortcuts for audio control
                this.setupAudioKeyboardShortcuts();
            } else {
                console.log('🎵 No audio file available');
                this.elements.reviewAudioPlayer.innerHTML = `
                    <div class="text-gray-400 text-sm">
                        <span class="text-gray-500">🎵</span> No audio file attached
                    </div>
                `;
            }
        } else {
            console.error('❌ reviewAudioPlayer element not found');
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
        console.log('📋 Storing currentProject in showReviewView:', {
            projectId: project.id,
            projectName: project.name,
            hasName: !!project.name,
            projectKeys: Object.keys(project)
        });
        this.currentProject = project;

        // Store original text for reset functionality
        this.originalTranscription = project.formattedText || project.transcription || '';
        
        // Show review view
        this.showView('review');
    }

    // Clear projects by status with confirmation
    clearProjectsByStatus(status) {
        console.log(`🗑️ Clear projects with status: ${status} requested`);
        
        const projects = this.projectManager.getAllProjects();
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
                    this.projectManager.deleteProject(project.id);
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
                projects = this.projectManager.getAllProjects().filter(p => p.status === CONFIG.PROJECT_STATUS.NEEDS_REVIEW);
            } else if (viewType === 'approved') {
                projects = this.projectManager.getAllProjects().filter(p => p.status === CONFIG.PROJECT_STATUS.APPROVED);
            } else {
                projects = this.projectManager.getAllProjects();
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

    // Delete a specific project
    async deleteProject(projectId) {
        console.log('🗑️ Delete project requested for ID:', projectId);
        
        try {
            const project = await this.projectManager.getProject(projectId);
            if (!project) {
                console.error('❌ Project not found:', projectId);
                this.showErrorMessage('Project not found');
                return;
            }

            console.log('🔍 Found project to delete:', project.name);

            // Show confirmation dialog
            const confirmed = confirm(`Are you sure you want to delete the project "${project.name}"?\n\nThis action cannot be undone.`);

            if (confirmed) {
                // If we're currently viewing this project, go back to projects list
                if (this.currentProject && this.currentProject.id === projectId) {
                    console.log('📤 Currently viewing project being deleted, returning to projects list');
                    this.currentProject = null;
                    this.showView('dashboard');
                }

                // Delete the project
                await this.projectManager.deleteProject(projectId);
                
                // Refresh the projects list to remove the deleted project
                await this.refreshProjectsList();
                
                // Show success message
                this.showSuccessMessage(`Project "${project.name}" has been deleted`);
                console.log('✅ Project deleted successfully:', project.name);
            } else {
                console.log('❌ Project deletion cancelled by user');
            }

        } catch (error) {
            console.error('❌ Error deleting project:', error);
            this.showErrorMessage(`Error deleting project: ${error.message}`);
        }
    }

    // Download transcription for a specific project
    downloadTranscription(projectId) {
        console.log('📥 downloadTranscription() called for project:', projectId);
        
        try {
            const project = this.projectManager.getProject(projectId);
            if (!project) {
                console.error('❌ Project not found:', projectId);
                this.showErrorMessage('Project not found');
                return;
            }

            if (!project.name) {
                console.error('❌ Project name is missing for project:', projectId);
                this.showErrorMessage('Project name is missing. Cannot download transcription.');
                return;
            }

            console.log('✅ Found project for download:', project.name);
            console.log('🔍 Available project fields:', Object.keys(project));

            // Get the transcription text using the same priority as showReviewView
            let transcriptionText = '';
            
            if (project.richContent) {
                // Has saved rich content (HTML from editor)
                transcriptionText = project.richContent;
                console.log('📄 Using richContent (saved rich text)');
            } else if (project.editedText) {
                // Has edited plain text
                transcriptionText = project.editedText;
                console.log('📄 Using editedText (saved plain text)');
            } else if (project.formattedText) {
                // Has formatted text from processing
                transcriptionText = project.formattedText;
                console.log('📄 Using formattedText (processed text)');
            } else if (project.transcription) {
                // Has original transcription
                transcriptionText = project.transcription;
                console.log('📄 Using transcription (original)');
            } else {
                console.error('❌ No transcription content found in project');
                console.log('❌ Project data:', {
                    richContent: !!project.richContent,
                    editedText: !!project.editedText,
                    formattedText: !!project.formattedText,
                    transcription: !!project.transcription
                });
                this.showErrorMessage('No transcription content available to download for this project');
                return;
            }

            // Clean HTML if needed (convert to plain text)
            const plainText = this.htmlToPlainText(transcriptionText);
            
            if (!plainText || plainText.trim().length === 0) {
                console.error('❌ Transcription text is empty after processing');
                this.showErrorMessage('Transcription content is empty');
                return;
            }

            // Sanitize filename
            const projectName = UTILS.sanitizeFilename(project.name);
            const fileName = `${projectName}_Transcription.txt`;

            // Create and download the file
            const blob = new Blob([plainText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log('📥 Downloaded transcription:', fileName);
            console.log('📝 Content length:', plainText.length, 'characters');
            this.showSuccessMessage(`Downloaded: ${fileName}`);

        } catch (error) {
            console.error('❌ Error downloading transcription:', error);
            this.showErrorMessage('Failed to download transcription: ' + error.message);
        }
    }

    // Helper method to convert HTML to plain text
    htmlToPlainText(html) {
        // Create a temporary div element
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Extract text content
        const plainText = tempDiv.textContent || tempDiv.innerText || '';
        
        // Clean up and return
        return plainText.trim();
    }

    // Initialize table sorting functionality
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

    // Sort table by column
    sortTable(column) {
        // Toggle sort direction
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        this.sortColumn = column;

        const projects = this.projectManager.getAllProjects();
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
        this.projectManager.projects = projects;
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
                if (command === 'autoParagraph') {
                    this.applyAutoParagraphing();
                } else if (command && command !== 'removeFormat') {
                    this.executeCommand(command, null);
                } else if (command === 'removeFormat') {
                    this.executeCommand('removeFormat', null);
                } else if (command === 'unlink') {
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

    // Execute rich text editing command
    executeCommand(command, value = null) {
        try {
            if (!this.elements.transcriptionEditor) return;
            
            this.elements.transcriptionEditor.focus();
            document.execCommand(command, false, value);
            this.updateTranscriptionPreview();
            this.updateWordCount();
        } catch (error) {
            console.error('❌ Error executing command:', command, error);
        }
    }

    // Update toolbar button states
    updateToolbarState() {
        if (!this.elements.transcriptionEditor) return;
        
        try {
            const toolbar = document.getElementById('editor-toolbar');
            if (!toolbar) return;
            
            // Update button states based on current selection
            const buttons = toolbar.querySelectorAll('[data-command]');
            buttons.forEach(btn => {
                const command = btn.getAttribute('data-command');
                if (command && ['bold', 'italic', 'underline'].includes(command)) {
                    if (document.queryCommandState(command)) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                }
            });
        } catch (error) {
            console.error('❌ Error updating toolbar state:', error);
        }
    }

    // Toggle between rich text and HTML source mode
    toggleSourceMode() {
        const editor = this.elements.transcriptionEditor;
        const sourceEditor = document.getElementById('transcription-source');
        if (!editor || !sourceEditor) return;
        this.isSourceMode = !this.isSourceMode;
        if (this.isSourceMode) {
            // Switch to source mode
            sourceEditor.value = editor.innerHTML;
            editor.style.display = 'none';
            sourceEditor.style.display = 'block';
            sourceEditor.classList.remove('hidden');
        } else {
            // Switch back to rich text mode
            editor.innerHTML = sourceEditor.value;
            sourceEditor.style.display = 'none';
            editor.style.display = 'block';
            sourceEditor.classList.add('hidden');
            this.updateTranscriptionPreview();
            this.updateWordCount();
        }
    }

    // Check and update backend status
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

    // Check if Whisper backend is available
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

    // Auto-start Whisper backend
    async autoStartWhisperBackend() {
        console.log('🚀 Auto-starting Whisper backend...');
        try {
            await this.checkAndUpdateBackendStatus();
        } catch (error) {
            console.error('Error auto-starting backend:', error);
        }
    }

    // Set rich text content in editor
    setRichTextContent(content, hasHTML = false) {
        const editor = this.elements.transcriptionEditor;
        if (!editor) return;
        
        if (hasHTML) {
            editor.innerHTML = content;
        } else {
            editor.textContent = content;
        }
        
        this.updateTranscriptionPreview();
        this.updateWordCount();
    }

    // Update transcription preview
    updateTranscriptionPreview() {
        const editor = this.elements.transcriptionEditor;
        const preview = document.getElementById('transcription-preview');
        
        if (editor && preview) {
            preview.innerHTML = editor.innerHTML || editor.textContent || '';
        }
    }

    // Update word count display
    updateWordCount() {
        const editor = this.elements.transcriptionEditor;
        const wordCountElement = document.getElementById('word-count');
        
        if (editor && wordCountElement) {
            const text = editor.textContent || editor.innerText || '';
            const words = text.trim().split(/\s+/).filter(word => word.length > 0);
            wordCountElement.textContent = `${words.length} words`;
        }
    }

    // Setup audio keyboard shortcuts
    setupAudioKeyboardShortcuts() {
        const audio = document.getElementById('review-audio');
        if (!audio) return;
        
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
                return;
            }
            
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
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
                    break;
            }
        });
    }

    // Get processing time estimate
    getProcessingTimeEstimate(fileSizeMB, previewMode = false) {
        if (previewMode) {
            return '~30 seconds';
        }
        
        if (fileSizeMB < 5) {
            return '1-2 minutes';
        } else if (fileSizeMB < 20) {
            return '3-5 minutes';
        } else if (fileSizeMB < 50) {
            return '5-10 minutes';
        } else {
            return '10+ minutes';
        }
    }

    // Escape HTML for safe display
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Show new project modal
    showNewProjectModal() {
        console.log('🔔 showNewProjectModal called');
        console.log('🔔 Modal element found:', !!this.elements.newProjectModal);
        if (this.elements.newProjectModal) {
            console.log('🔔 Modal classes before:', this.elements.newProjectModal.className);
            this.elements.newProjectModal.classList.remove('hidden');
            console.log('🔔 Modal classes after:', this.elements.newProjectModal.className);
            // Force display style as backup
            this.elements.newProjectModal.style.display = 'flex';
            this.elements.newProjectModal.style.position = 'fixed';
            this.elements.newProjectModal.style.top = '0';
            this.elements.newProjectModal.style.left = '0';
            this.elements.newProjectModal.style.right = '0';
            this.elements.newProjectModal.style.bottom = '0';
            this.elements.newProjectModal.style.backgroundColor = 'rgba(75, 85, 99, 0.5)';
            this.elements.newProjectModal.style.zIndex = '9999';
            this.elements.newProjectModal.style.alignItems = 'center';
            this.elements.newProjectModal.style.justifyContent = 'center';
            console.log('🔔 Modal forced styles applied');
        } else {
            console.error('❌ New project modal element not found!');
        }
    }

    // Hide new project modal
    hideNewProjectModal() {
        if (this.elements.newProjectModal) {
            this.elements.newProjectModal.classList.add('hidden');
            this.elements.newProjectModal.style.display = 'none';
        }
    }

    // Show transcription modal (for processing)
    showTranscriptionModal(projectId, audioFile, previewMode, projectName) {
        console.log('📝 Showing transcription modal for processing...');
        this.showBackgroundProcessing(`Processing ${projectName}...`);
        this.processProjectAudioBackground(projectId, audioFile, previewMode, projectName);
    }

    // Refresh review projects list
    refreshReviewProjectsList() {
        console.log('🔄 Refreshing review projects list');
        const reviewProjects = this.projectManager.getAllProjects()
            .filter(p => p.status === CONFIG.PROJECT_STATUS.NEEDS_REVIEW);
        this.populateProjectsTable(reviewProjects, 'review');
    }

    // Refresh approved projects list
    refreshApprovedProjectsList() {
        console.log('🔄 Refreshing approved projects list');
        const approvedProjects = this.projectManager.getAllProjects()
            .filter(p => p.status === CONFIG.PROJECT_STATUS.APPROVED);
        this.populateProjectsTable(approvedProjects, 'approved');
    }

    // Initialize local view (placeholder)
    initializeLocalView() {
        console.log('🔧 Initializing local view...');
        // Placeholder for local view initialization
    }

    // Open a specific project for editing
    async openProject(projectId) {
        console.log('📂 Opening project for editing:', projectId);
        try {
            // Force fresh data fetch to ensure we have complete project data including audio info
            const project = await this.projectManager.getProject(projectId, true);
            if (!project) {
                this.showErrorMessage('Project not found');
                return;
            }
            
            console.log('📂 Retrieved project data:', {
                name: project.name,
                audioUrl: project.audioUrl,
                audioFilePath: project.audioFilePath,
                audioFileName: project.audioFileName
            });
            
            this.showReviewView(project);
        } catch (error) {
            console.error('❌ Error opening project:', error);
            this.showErrorMessage('Error opening project: ' + error.message);
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

    // Cancel processing modal methods
    showCancelProcessingModal() {
        console.log('🛑 Showing cancel processing modal...');
        if (this.elements.cancelProcessingModal) {
            this.elements.cancelProcessingModal.classList.remove('hidden');
        }
    }
    
    hideCancelProcessingModal() {
        console.log('✅ Hiding cancel processing modal...');
        if (this.elements.cancelProcessingModal) {
            this.elements.cancelProcessingModal.classList.add('hidden');
        }
    }
    
    confirmCancelProcessing() {
        console.log('🛑 User confirmed cancelling processing...');
        this.hideCancelProcessingModal();
        this.cancelCurrentProcessing();
    }

    async approveFinal() {
        console.log('🎯 approveFinal() called');
        console.log('🔍 Current project status:', {
            currentProject: this.currentProject,
            hasProject: !!this.currentProject,
            projectName: this.currentProject?.name,
            projectId: this.currentProject?.id
        });
        
        // Debug: Log all properties of currentProject
        if (this.currentProject) {
            console.log('🔍 Complete currentProject object:', this.currentProject);
            console.log('🔍 currentProject keys:', Object.keys(this.currentProject));
            console.log('🔍 Project name value:', JSON.stringify(this.currentProject.name));
        }
        
        if (!this.currentProject || !this.elements.transcriptionEditor) {
            console.error('❌ Missing currentProject or transcriptionEditor:', {
                currentProject: !!this.currentProject,
                transcriptionEditor: !!this.elements.transcriptionEditor
            });
            this.showErrorMessage('No project selected or editor not found');
            return;
        }
        
        // Try to refresh the project data if name is missing
        if (!this.currentProject.name && this.currentProject.id) {
            console.log('🔄 Project name missing, trying to refresh project data...');
            try {
                const refreshedProject = await this.projectManager.getProject(this.currentProject.id, true);
                if (refreshedProject && refreshedProject.name) {
                    console.log('✅ Refreshed project data:', refreshedProject.name);
                    this.currentProject = refreshedProject;
                } else {
                    console.error('❌ Failed to refresh project data or name still missing');
                }
            } catch (error) {
                console.error('❌ Error refreshing project data:', error);
            }
        }
        
        if (!this.currentProject.name) {
            console.error('❌ Project name is missing');
            this.showErrorMessage('Project name is missing. Cannot approve project.');
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
            await this.projectManager.updateProject(this.currentProject.id, {
                editedText: finalText, // Store plain text
                finalText: finalText, // Store plain final text
                richContent: richContent, // Store rich text HTML
                formattedText: formattedFinalText, // Store formatted version for display
                status: 'Approved',
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
    
    // Export as PDF using browser print functionality
    exportPdf() {
        console.log('📄 exportPdf() called');
        console.log('🔍 Current project status:', {
            currentProject: this.currentProject,
            hasProject: !!this.currentProject,
            projectName: this.currentProject?.name,
            projectId: this.currentProject?.id
        });
        
        if (!this.currentProject || !this.elements.transcriptionEditor) {
            console.error('❌ Missing currentProject or transcriptionEditor for PDF export');
            this.showErrorMessage('Cannot export PDF: No project selected or editor not found');
            return;
        }
        
        if (!this.currentProject.name) {
            console.error('❌ Project name is missing');
            this.showErrorMessage('Project name is missing. Cannot export PDF.');
            return;
        }
        
        console.log('✅ Exporting PDF for project:', this.currentProject.name);
        
        try {
            const finalText = this.getRichTextContent(false); // Get formatted HTML
            const projectName = UTILS.sanitizeFilename(this.currentProject.name);
            
            if (!finalText || finalText.trim().length === 0) {
                this.showErrorMessage('Cannot export empty transcription');
                return;
            }
            
            // Create PDF content in a new window for printing
            const projectInfo = {
                name: this.currentProject.name,
                assignedTo: this.currentProject.assignedTo || 'Unassigned',
                audioFileName: this.currentProject.audioFileName || 'Unknown',
                dateCreated: new Date(this.currentProject.created).toLocaleDateString(),
                dateExported: new Date().toLocaleDateString(),
                wordCount: finalText.replace(/<[^>]*>/g, '').trim().split(/\s+/).length,
                characterCount: finalText.replace(/<[^>]*>/g, '').length
            };
            
            const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${projectName} - Final Transcription</title>
                <style>
                    @media print {
                        body { margin: 0.5in; font-family: 'Times New Roman', serif; line-height: 1.6; }
                        .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                        .project-info { display: grid; grid-template-columns: auto 1fr; gap: 10px; margin-bottom: 20px; }
                        .label { font-weight: bold; }
                        .content { padding-top: 20px; }
                        h1 { font-size: 24px; margin: 0; }
                        h2 { font-size: 20px; margin: 15px 0 10px 0; }
                        h3 { font-size: 18px; margin: 12px 0 8px 0; }
                        p { margin: 8px 0; }
                        .pali-text { background-color: #f0e6ff; padding: 1px 3px; }
                    }
                    @media screen {
                        body { max-width: 8.5in; margin: 20px auto; padding: 20px; font-family: 'Times New Roman', serif; line-height: 1.6; }
                        .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                        .project-info { display: grid; grid-template-columns: auto 1fr; gap: 10px; margin-bottom: 20px; }
                        .label { font-weight: bold; }
                        .content { padding-top: 20px; }
                        .print-instruction { background: #e3f2fd; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                    }
                </style>
            </head>
            <body>
                <div class="print-instruction">
                    <strong>PDF Export Instructions:</strong> Use your browser's print function (Ctrl+P or Cmd+P) and select "Save as PDF" to create a PDF file.
                </div>
                
                <div class="header">
                    <h1>${projectInfo.name} - Final Transcription</h1>
                </div>
                
                <div class="project-info">
                    <span class="label">Project:</span><span>${projectInfo.name}</span>
                    <span class="label">Assigned to:</span><span>${projectInfo.assignedTo}</span>
                    <span class="label">Audio File:</span><span>${projectInfo.audioFileName}</span>
                    <span class="label">Date Created:</span><span>${projectInfo.dateCreated}</span>
                    <span class="label">Date Exported:</span><span>${projectInfo.dateExported}</span>
                    <span class="label">Word Count:</span><span>${projectInfo.wordCount}</span>
                    <span class="label">Character Count:</span><span>${projectInfo.characterCount}</span>
                </div>
                
                <div class="content">
                    <h2>Transcription:</h2>
                    ${finalText}
                </div>
                
                <script>
                    // Auto-trigger print dialog after a short delay
                    setTimeout(function() {
                        window.print();
                    }, 1000);
                </script>
            </body>
            </html>
            `;
            
            // Open in new window for printing
            const printWindow = window.open('', '_blank');
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            
            console.log('📄 PDF export window opened successfully');
            this.showSuccessMessage('PDF export window opened. Use your browser\'s print function to save as PDF.');
            
        } catch (error) {
            console.error('❌ Error exporting PDF:', error);
            this.showErrorMessage('Failed to export PDF: ' + error.message);
        }
    }
    
    // Create document content for DOCX
    createDocumentContent(transcriptionText) {
        const projectInfo = {
            name: this.currentProject.name,
            assignedTo: this.currentProject.assignedTo || 'Unassigned',
            audioFileName: this.currentProject.audioFileName || 'Unknown',
            dateCreated: new Date(this.currentProject.created).toLocaleDateString(),
            dateExported: new Date().toLocaleDateString(),
            wordCount: transcriptionText.trim().split(/\s+/).length,
            characterCount: transcriptionText.length
        };
        
        // Create RTF-style content that's compatible with Word
        const rtfHeader = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}`;
        const rtfContent = `
\\f0\\fs24 
\\b\\fs32 ${projectInfo.name} - Final Transcription\\b0\\fs24\\par
\\par
\\b Project:\\b0 ${projectInfo.name}\\par
\\b Assigned to:\\b0 ${projectInfo.assignedTo}\\par
\\b Audio File:\\b0 ${projectInfo.audioFileName}\\par
\\b Date Created:\\b0 ${projectInfo.dateCreated}\\par
\\b Date Exported:\\b0 ${projectInfo.dateExported}\\par
\\b Word Count:\\b0 ${projectInfo.wordCount}\\par
\\b Character Count:\\b0 ${projectInfo.characterCount}\\par
\\par
\\b Transcription:\\b0\\par
\\par
${transcriptionText.replace(/\n/g, '\\par ')}
}`;
        
        return rtfHeader + rtfContent;
    }
    
    // Get rich text content (HTML or plain text)
    getRichTextContent(asPlainText = false) {
        const editor = this.elements.transcriptionEditor;
        if (!editor) return '';
        
        if (asPlainText) {
            return editor.textContent || editor.innerText || '';
        } else {
            return editor.innerHTML || '';
        }
    }
    
    // Save draft functionality
    async saveDraft() {
        console.log('💾 saveDraft() called');
        
        if (!this.currentProject || !this.elements.transcriptionEditor) {
            console.error('❌ Missing currentProject or transcriptionEditor for save draft');
            this.showErrorMessage('Cannot save draft: No project selected or editor not found');
            return;
        }
        
        if (!this.currentProject.name) {
            console.error('❌ Project name is missing');
            this.showErrorMessage('Project name is missing. Cannot save draft.');
            return;
        }
        
        console.log('✅ Saving draft for project:', this.currentProject.name);
        
        try {
            const draftText = this.getRichTextContent(true); // Get plain text
            const richContent = this.getRichTextContent(false); // Get HTML content
            
            if (!draftText || draftText.trim().length === 0) {
                this.showErrorMessage('Cannot save empty draft');
                return;
            }
            
            // Update project with draft content
            const updateData = {
                editedText: draftText,
                richContent: richContent,
                status: CONFIG.PROJECT_STATUS.NEEDS_REVIEW,
                lastModified: new Date().toISOString()
            };
            
            await this.projectManager.updateProject(this.currentProject.id, updateData);
            
            // Update current project reference
            this.currentProject = await this.projectManager.getProject(this.currentProject.id);
            
            // Show success message
            this.showSuccessMessage('Draft saved successfully!');
            
            // Update word count to reflect any changes
            this.updateWordCount();
            
            console.log('✅ Draft saved successfully');
            
        } catch (error) {
            console.error('❌ Error saving draft:', error);
            this.showErrorMessage('Error saving draft: ' + error.message);
        }
    }
    
    // Reset to original transcription text
    resetToOriginalText() {
        console.log('🔄 resetToOriginalText() called');
        
        if (!this.currentProject || !this.elements.transcriptionEditor) {
            console.error('❌ Missing currentProject or transcriptionEditor for reset');
            return;
        }
        
        const confirmReset = confirm('Are you sure you want to reset to the original transcription? All changes will be lost.');
        if (!confirmReset) {
            return;
        }
        
        try {
            // Get the original transcription (prioritize formattedText, then transcription)
            const originalText = this.originalTranscription || this.currentProject.formattedText || this.currentProject.transcription || '';
            
            if (!originalText) {
                this.showErrorMessage('No original transcription found to reset to');
                return;
            }
            
            // Check if original text has HTML formatting
            const hasHTML = /<[^>]*>/.test(originalText);
            this.setRichTextContent(originalText, hasHTML);
            
            // Update word count
            this.updateWordCount();
            this.updateTranscriptionPreview();
            
            this.showSuccessMessage('Text reset to original transcription');
            console.log('✅ Text reset to original successfully');
            
        } catch (error) {
            console.error('❌ Error resetting text:', error);
            this.showErrorMessage('Error resetting text: ' + error.message);
        }
    }
}

// Expose UIController to global scope
window.UIController = UIController;

// Initialize UI Controller when page loads
let uiController;
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 Initializing UI Controller...');
    uiController = new UIController();
    window.uiController = uiController; // Also expose instance globally
    console.log('✅ UI Controller initialized');
});
