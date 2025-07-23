// UI Controller for managing user interface interactions
class UIController {
    constructor() {
        this.currentView = 'projects';
        this.currentProject = null;
        this.searchDebounce = null;
        this.elements = {};
        this.init();
    }

    // Initialize UI controller
    init() {
        this.cacheElements();
        this.bindEvents();
        this.showView('projects');
        this.refreshProjectsList();
        
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
        this.elements = {
            // Tabs
            tabProjects: document.getElementById('tab-projects'),
            tabCreate: document.getElementById('tab-create'),
            tabLocal: document.getElementById('tab-local'),

            // Views
            viewProjects: document.getElementById('view-projects'),
            viewCreate: document.getElementById('view-create'),
            viewReview: document.getElementById('view-review'),
            viewLocal: document.getElementById('view-local'),

            // Projects list
            projectsList: document.getElementById('projects-list'),
            searchProjects: document.getElementById('search-projects'),
            btnNewProject: document.getElementById('btn-new-project'),

            // Create project form
            createProjectForm: document.getElementById('create-project-form'),
            projectName: document.getElementById('project-name'),
            assignedTo: document.getElementById('assigned-to'),
            btnCancelCreate: document.getElementById('btn-cancel-create'),
            
            // Review project
            projectDetails: document.getElementById('project-details'),
            btnBackToProjects: document.getElementById('btn-back-to-projects'),

            // Modals
            loadingModal: document.getElementById('loading-modal'),
            successModal: document.getElementById('success-modal'),
            successMessage: document.getElementById('success-message'),
            closeSuccessModal: document.getElementById('close-success-modal'),

            // Local Whisper elements
            localFileDrop: document.getElementById('local-file-drop'),
            localAudioFiles: document.getElementById('local-audio-files'),
            whisperModel: document.getElementById('whisper-model'),
            outputFormat: document.getElementById('output-format'),
            whisperLanguage: document.getElementById('whisper-language'),
            whisperCommands: document.getElementById('whisper-commands'),
            copyCommands: document.getElementById('copy-commands'),
            importTranscription: document.getElementById('import-transcription'),
            
            // Backend status elements
            backendStatusIndicator: document.getElementById('backend-status-indicator'),
            backendStatusText: document.getElementById('backend-status-text'),
            btnTestBackend: document.getElementById('btn-test-backend'),
            backendInstructions: document.getElementById('backend-instructions'),
            
            // Elements that may not exist in simplified create form
            methodLocal: document.getElementById('method-local'),
            methodApi: document.getElementById('method-api'),
            localWhisperOptions: document.getElementById('local-whisper-options'),
            apiOptions: document.getElementById('api-options'),
            projectAudioFile: document.getElementById('project-audio-file'), // Updated to match HTML
            apiKey: document.getElementById('api-key'),

            // Start backend button
            btnStartBackend: document.getElementById('btn-start-backend')
        };
    }

    // Bind event listeners
    bindEvents() {
        // Tab navigation
        this.elements.tabProjects.addEventListener('click', () => this.showView('projects'));
        this.elements.tabCreate.addEventListener('click', () => this.showView('create'));
        this.elements.tabLocal.addEventListener('click', () => this.showView('local'));

        // Project management
        this.elements.btnNewProject.addEventListener('click', () => {
            console.log('🔔 New Project button clicked');
            this.showView('create');
        });
        this.elements.btnBackToProjects.addEventListener('click', () => this.showView('projects'));

        // Search
        this.elements.searchProjects.addEventListener('input', (e) => {
            this.debouncedSearch(e.target.value);
        });

        // Create project form
        if (this.elements.createProjectForm) {
            console.log('✅ Binding create project form event');
            this.elements.createProjectForm.addEventListener('submit', (e) => {
                console.log('📝 Form submit event triggered');
                e.preventDefault();
                this.handleCreateProject();
            });
        } else {
            console.warn('⚠️ Create project form not found during binding');
        }

        if (this.elements.btnCancelCreate) {
            this.elements.btnCancelCreate.addEventListener('click', () => {
                this.resetCreateForm();
                this.showView('projects');
            });
        }

        // Modal close
        this.elements.closeSuccessModal.addEventListener('click', () => {
            this.hideModal('success');
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Local Whisper events
        this.bindLocalWhisperEvents();
        
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
    }

    // Bind local Whisper events
    bindLocalWhisperEvents() {
        if (!this.elements.localFileDrop) return;

        // File drop events
        this.elements.localFileDrop.addEventListener('click', () => {
            this.elements.localAudioFiles.click();
        });

        this.elements.localFileDrop.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.localFileDrop.classList.add('drag-over');
        });

        this.elements.localFileDrop.addEventListener('dragleave', () => {
            this.elements.localFileDrop.classList.remove('drag-over');
        });

        this.elements.localFileDrop.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.localFileDrop.classList.remove('drag-over');
            this.handleLocalFilesSelected(e.dataTransfer.files);
        });

        // File selection
        this.elements.localAudioFiles.addEventListener('change', (e) => {
            this.handleLocalFilesSelected(e.target.files);
        });

        // Settings change
        [this.elements.whisperModel, this.elements.outputFormat, this.elements.whisperLanguage].forEach(el => {
            if (el) el.addEventListener('change', () => this.updateWhisperCommands());
        });

        // Copy commands
        if (this.elements.copyCommands) {
            this.elements.copyCommands.addEventListener('click', () => this.copyCommandsToClipboard());
        }

        // Import transcription
        if (this.elements.importTranscription) {
            this.elements.importTranscription.addEventListener('change', (e) => {
                this.handleTranscriptionImport(e.target.files);
            });
        }
    }

    // Show specific view
    showView(viewName) {
        // Update tab statesching to view: ${viewName}`);
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        });ument.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        // Hide all views
        document.querySelectorAll('.view-content').forEach(view => {
            view.classList.add('hidden');
        });ument.querySelectorAll('.view-content').forEach(view => {
            view.classList.add('hidden');
        // Show selected view
        switch (viewName) {
            case 'projects':w
                this.elements.tabProjects.classList.add('active');
                this.elements.viewProjects.classList.remove('hidden');
                this.refreshProjectsList();lassList.add('active');
                break;lements.viewProjects.classList.remove('hidden');
            case 'create':shProjectsList();
                this.elements.tabCreate.classList.add('active');
                this.elements.viewCreate.classList.remove('hidden');
                this.resetCreateForm();.classList.add('active');
                // Re-cache elements after showing the create view);
                setTimeout(() => {ate view shown');
                    this.cacheCreateFormElements();n't try to rebind events
                    this.bindCreateFormEvents();
                }, 100);
                break;l':
            case 'local':ents.tabLocal.classList.add('active');
                this.elements.tabLocal.classList.add('active');n');
                this.elements.viewLocal.classList.remove('hidden');
                this.initializeLocalView();
                break;ew':
            case 'review':nts.viewReview.classList.remove('hidden');
                this.elements.viewReview.classList.remove('hidden');
                break;
        }
        this.currentView = viewName;
        this.currentView = viewName;
    }
    // Cache create form elements (called when showing create view)
    // Cache create form elements (called when showing create view)
    cacheCreateFormElements() {jectForm = document.getElementById('create-project-form');
        this.elements.createProjectForm = document.getElementById('create-project-form');
        this.elements.projectName = document.getElementById('project-name');
        this.elements.assignedTo = document.getElementById('assigned-to');l-create');
        this.elements.btnCancelCreate = document.getElementById('btn-cancel-create');
        console.log('🔄 Re-cached create form elements:', {
            form: !!this.elements.createProjectForm,,
            projectName: !!this.elements.projectName,
            assignedTo: !!this.elements.assignedTo,ate
            cancelBtn: !!this.elements.btnCancelCreate
        });
    }
    // Bind create form events (called when showing create view)
    // Bind create form events (called when showing create view)
    bindCreateFormEvents() {eateProjectForm) {
        if (this.elements.createProjectForm) {roject form event');
            console.log('✅ Re-binding create project form event');
            // Remove existing listeners firstteProjectForm.cloneNode(true);
            const newForm = this.elements.createProjectForm.cloneNode(true); this.elements.createProjectForm);
            this.elements.createProjectForm.parentNode.replaceChild(newForm, this.elements.createProjectForm);
            this.elements.createProjectForm = newForm;
            this.elements.createProjectForm.addEventListener('submit', (e) => {
            this.elements.createProjectForm.addEventListener('submit', (e) => {
                console.log('📝 Form submit event triggered (re-bound)');
                e.preventDefault();oject();
                this.handleCreateProject();
            });
        }
        if (this.elements.btnCancelCreate) {
        if (this.elements.btnCancelCreate) {dEventListener('click', () => {
            this.elements.btnCancelCreate.addEventListener('click', () => {
                this.resetCreateForm();');
                this.showView('projects');
            });
        }
    }
    // Handle create project form submission
    // Handle create project form submission
    async handleCreateProject() {oject form submitted');
        console.log('🚀 Create project form submitted');
        try {onst formData = {
            const formData = {ments.projectName.value.trim(),
                name: this.elements.projectName.value.trim(),im()
                assignedTo: this.elements.assignedTo.value.trim()
            };
            console.log('📝 Form data:', formData);
            console.log('📝 Form data:', formData);
            // Get the audio file and preview mode from the form
            // Get the audio file and preview mode from the formect-audio-file');
            const audioFileInput = document.getElementById('project-audio-file');e');
            const previewModeInput = document.getElementById('project-preview-mode');
            console.log('🎵 Audio file input found:', !!audioFileInput);
            console.log('🎵 Audio file input found:', !!audioFileInput);ut);
            console.log('🔍 Preview mode input found:', !!previewModeInput);
            if (!audioFileInput || !audioFileInput.files[0]) {
            if (!audioFileInput || !audioFileInput.files[0]) {file');
                this.showErrorMessage('Please select an audio file');
                return;
            }
            const audioFile = audioFileInput.files[0];
            const audioFile = audioFileInput.files[0];viewModeInput.checked : false;
            const previewMode = previewModeInput ? previewModeInput.checked : false;
            console.log('🎵 Audio file:', audioFile.name, audioFile.size);
            console.log('🎵 Audio file:', audioFile.name, audioFile.size);
            console.log('🔍 Preview mode:', previewMode);
            // Create project (starts in NEW status)
            // Create project (starts in NEW status)ject(formData);
            const project = projectManager.createProject(formData);
            console.log('✅ Project created:', project.id);
            // Immediately attach audio file and start processing
            // Immediately attach audio file and start processinge, 'local', previewMode);
            await this.handleAttachAudioFile(project.id, audioFile, 'local', previewMode);
            this.showSuccessMessage(`Project "${project.name}" created and processing started!`);
            this.showSuccessMessage(`Project "${project.name}" created and processing started!`);
            this.resetCreateForm();project.id); // Go directly to project review
            this.showProjectReview(project.id); // Go directly to project review
        } catch (error) {
        } catch (error) {('❌ Error creating project:', error);
            console.error('❌ Error creating project:', error);
            this.showErrorMessage(error.message);
        }
    }
    // Show Local Whisper instructions after project creation
    // Show Local Whisper instructions after project creation {
    showLocalWhisperInstructions(project, audioFile, command) {
        const instructionsHTML = `0 border border-green-200 rounded-lg p-6 mb-6">
            <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <h3 class="text-lg font-semibold text-green-800 mb-4">isper!
                    🎉 Project "${project.name}" Created with Local Whisper!
                </h3>
                <div class="space-y-4">
                <div class="space-y-4">
                    <div>h4 class="font-semibold text-gray-700">Audio File:</h4>
                        <h4 class="font-semibold text-gray-700">Audio File:</h4>atFileSize(audioFile.size)})</p>
                        <p class="text-gray-600">${audioFile.name} (${UTILS.formatFileSize(audioFile.size)})</p>
                        <div class="text-sm text-green-600 font-medium mt-1">ed processing!)
                            ✅ No file size limits with Local Whisper (unlimited processing!)
                        </div>
                    </div>
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">omatic Processing</h4>
                        <h4 class="font-semibold text-blue-800 mb-3">Ready for Automatic Processing</h4>
                        <p class="text-gray-700 mb-4"> automatically process your audio file using Local Whisper. 
                            Click "Convert to Text" to automatically process your audio file using Local Whisper. 
                            The system will handle all the technical details for you.
                        </p>
                        <div class="flex space-x-4">
                        <div class="flex space-x-4">ext-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2">
                            <button id="convert-to-text-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2">
                                <span>🎵</span>o Text</span>
                                <span>Convert to Text</span>
                            </button>d="show-manual-commands" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">
                            <button id="show-manual-commands" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">
                                Show Manual Commands
                            </button>
                        </div>
                    </div>
                    <!-- Manual Commands (hidden by default) -->
                    <!-- Manual Commands (hidden by default) -->den bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div id="manual-commands-section" class="hidden bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-700 mb-2">Manual Terminal Commands (Advanced Users)</h4>
                        <div class="bg-gray-100 rounded p-3 font-mono text-sm mb-2">ojects/audio-text-converter"<br>
                            cd "/Users/vijayaraghavanvedantham/Documents/VRI Tech Projects/audio-text-converter"<br>
                            source whisper-env/bin/activate<br>
                            ${command}
                        </div>n id="copy-whisper-command" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm">
                        <button id="copy-whisper-command" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm">
                            Copy Commands
                        </button>
                    </div>
                    <!-- Progress Tracking -->
                    <!-- Progress Tracking --> class="hidden">
                    <div id="progress-section" class="hidden">">Processing Progress</h4>
                        <h4 class="font-semibold text-gray-700">Processing Progress</h4>
                        <div class="bg-white border border-gray-200 rounded p-4">
                            <div class="flex items-center justify-between mb-2">Converting Audio to Text...</span>
                                <span class="text-sm font-medium text-gray-700">Converting Audio to Text...</span>
                                <span id="progress-percentage" class="text-sm text-gray-500">0%</span>
                            </div>lass="w-full bg-gray-200 rounded-full h-3">
                            <div class="w-full bg-gray-200 rounded-full h-3">3 rounded-full transition-all duration-500" style="width: 0%"></div>
                                <div id="progress-bar" class="bg-green-600 h-3 rounded-full transition-all duration-500" style="width: 0%"></div>
                            </div>lass="flex justify-between text-xs text-gray-500 mt-2">
                            <div class="flex justify-between text-xs text-gray-500 mt-2">
                                <span>Started: <span id="start-time">--</span></span>span>
                                <span>Elapsed: <span id="elapsed-time">00:00</span></span>>
                                <span>ETA: <span id="eta-time">Calculating...</span></span>
                            </div>d="conversion-status" class="mt-3 text-sm text-gray-600">
                            <div id="conversion-status" class="mt-3 text-sm text-gray-600">
                                Initializing Local Whisper...
                            </div>
                        </div>n id="cancel-conversion" class="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm">
                        <button id="cancel-conversion" class="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm">
                            Cancel Conversion
                        </button>
                    </div>
                    <!-- Results Section -->
                    <!-- Results Section -->" class="hidden">
                    <div id="results-section" class="hidden">0">Conversion Complete!</h4>
                        <h4 class="font-semibold text-gray-700">Conversion Complete!</h4>
                        <div class="bg-green-100 border border-green-300 rounded p-4">ted to text!</p>
                            <p class="text-green-800 mb-2">✅ Audio successfully converted to text!</p>
                            <div id="conversion-stats" class="text-sm text-gray-600">
                                <!-- Stats will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex space-x-4 mt-6">
                <div class="flex space-x-4 mt-6">ect" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded">
                    <button id="btn-continue-project" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded">
                        Continue to Project
                    </button>d="btn-back-to-projects-from-whisper" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded">
                    <button id="btn-back-to-projects-from-whisper" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded">
                        Back to Projects
                    </button>
                </div>
            </div>
        `;
        // Replace the create form with instructions
        // Replace the create form with instructions
        this.elements.viewCreate.innerHTML = `adow-md p-6">
            <div class="bg-white rounded-lg shadow-md p-6">-800 mb-6">Local Whisper Instructions</h2>
                <h2 class="text-2xl font-semibold text-gray-800 mb-6">Local Whisper Instructions</h2>
                ${instructionsHTML}
            </div>
        `;
        // Bind events for the new buttons
        // Bind events for the new buttonso-text-btn').addEventListener('click', () => {
        document.getElementById('convert-to-text-btn').addEventListener('click', () => {
            this.startAutomaticConversion(project, audioFile, command);
        });
        document.getElementById('show-manual-commands').addEventListener('click', () => {
        document.getElementById('show-manual-commands').addEventListener('click', () => {;
            document.getElementById('manual-commands-section').classList.toggle('hidden');
        });
        document.getElementById('copy-whisper-command').addEventListener('click', () => {
        document.getElementById('copy-whisper-command').addEventListener('click', () => {RI Tech Projects/audio-text-converter"\nsource whisper-env/bin/activate\n${command}`);
            navigator.clipboard.writeText(`cd "/Users/vijayaraghavanvedantham/Documents/VRI Tech Projects/audio-text-converter"\nsource whisper-env/bin/activate\n${command}`);
            this.showSuccessMessage('Commands copied to clipboard!');
        });
        document.getElementById('btn-continue-project').addEventListener('click', () => {
        document.getElementById('btn-continue-project').addEventListener('click', () => {
            this.showProjectReview(project.id);
        });
        document.getElementById('btn-back-to-projects-from-whisper').addEventListener('click', () => {
        document.getElementById('btn-back-to-projects-from-whisper').addEventListener('click', () => {
            this.showView('projects');
        });
        document.getElementById('import-result-file').addEventListener('change', (e) => {
        document.getElementById('import-result-file').addEventListener('change', (e) => {
            this.handleTranscriptionImportForProject(e.target.files[0], project.id);
        });
        // Progress tracking functionality
        // Progress tracking functionalityle);
        this.setupProgressTracking(audioFile);
    }
    // Setup progress tracking for Local Whisper processing
    // Setup progress tracking for Local Whisper processing
    setupProgressTracking(audioFile) {
        let startTime = null;= null;
        let progressInterval = null;
        let elapsedInterval = null;
        const startTrackingBtn = document.getElementById('start-tracking');
        const startTrackingBtn = document.getElementById('start-tracking');omplete');
        const processingCompleteBtn = document.getElementById('processing-complete');
        const progressSection = document.getElementById('progress-section');
        const progressBar = document.getElementById('progress-bar');-percentage');
        const progressPercentage = document.getElementById('progress-percentage');
        const startTimeEl = document.getElementById('start-time');e');
        const elapsedTimeEl = document.getElementById('elapsed-time');
        const etaTimeEl = document.getElementById('eta-time');
        // Show progress section when command is copied
        // Show progress section when command is copied.addEventListener('click', () => {
        document.getElementById('copy-whisper-command').addEventListener('click', () => {
            progressSection.classList.remove('hidden');
        });
        // Start tracking button
        // Start tracking buttontListener('click', () => {
        startTrackingBtn.addEventListener('click', () => {
            startTime = new Date(); = startTime.toLocaleTimeString();
            startTimeEl.textContent = startTime.toLocaleTimeString();
            startTrackingBtn.classList.add('hidden');idden');
            processingCompleteBtn.classList.remove('hidden');
            // Estimate processing time based on file size (rough estimate: 1MB per 30 seconds)
            // Estimate processing time based on file size (rough estimate: 1MB per 30 seconds)
            const estimatedDurationMs = (audioFile.size / (1024 * 1024)) * 30 * 1000;
            let currentProgress = 0;
            // Update progress bar with estimated progress
            // Update progress bar with estimated progress
            progressInterval = setInterval(() => {
                currentProgress += 1;= 100) {
                if (currentProgress <= 100) { currentProgress + '%';
                    progressBar.style.width = currentProgress + '%'; + '%';
                    progressPercentage.textContent = currentProgress + '%';
                    // Calculate ETA
                    // Calculate ETADate.now() - startTime.getTime();
                    const elapsed = Date.now() - startTime.getTime();) * 100;
                    const estimatedTotal = (elapsed / currentProgress) * 100;
                    const remaining = estimatedTotal - elapsed;
                    if (remaining > 0) {
                    if (remaining > 0) { = Math.floor(remaining / 60000);
                        const etaMinutes = Math.floor(remaining / 60000); / 1000);
                        const etaSeconds = Math.floor((remaining % 60000) / 1000);ng().padStart(2, '0')}`;
                        etaTimeEl.textContent = `${etaMinutes}:${etaSeconds.toString().padStart(2, '0')}`;
                    } else {imeEl.textContent = 'Almost done...';
                        etaTimeEl.textContent = 'Almost done...';
                    }e {
                } else {fter 100%, show "processing" state
                    // After 100%, show "processing" statelizing...';
                    progressPercentage.textContent = 'Finalizing...';
                    etaTimeEl.textContent = 'Almost done...';
                }timatedDurationMs / 100);
            }, estimatedDurationMs / 100);
            // Update elapsed time every second
            // Update elapsed time every second {
            elapsedInterval = setInterval(() => {tTime.getTime();
                const elapsed = Date.now() - startTime.getTime();
                const minutes = Math.floor(elapsed / 60000); / 1000);
                const seconds = Math.floor((elapsed % 60000) / 1000);tring().padStart(2, '0')}`;
                elapsedTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }, 1000);
        });
        // Processing complete button
        // Processing complete buttontListener('click', () => {
        processingCompleteBtn.addEventListener('click', () => {l);
            if (progressInterval) clearInterval(progressInterval);
            if (elapsedInterval) clearInterval(elapsedInterval);
            progressBar.style.width = '100%';
            progressBar.style.width = '100%';'100%';
            progressPercentage.textContent = '100%';
            etaTimeEl.textContent = 'Complete!';
            const totalTime = Date.now() - startTime.getTime();
            const totalTime = Date.now() - startTime.getTime();
            const minutes = Math.floor(totalTime / 60000); / 1000);
            const seconds = Math.floor((totalTime % 60000) / 1000);
            // Show completion message
            // Show completion messagement.createElement('div');
            const completionMsg = document.createElement('div');der border-green-300 rounded text-green-800';
            completionMsg.className = 'mt-4 p-3 bg-green-100 border border-green-300 rounded text-green-800';
            completionMsg.innerHTML = `mplete!</strong><br>
                <strong>✅ Processing Complete!</strong><br>.padStart(2, '0')}<br>
                Total time: ${minutes}:${seconds.toString().padStart(2, '0')}<br>
                File size: ${UTILS.formatFileSize(audioFile.size)}<br>/ 1000 / 60)).toFixed(2)} MB/min
                Speed: ${(audioFile.size / (1024 * 1024) / (totalTime / 1000 / 60)).toFixed(2)} MB/min
            `;ogressSection.appendChild(completionMsg);
            progressSection.appendChild(completionMsg);
            processingCompleteBtn.classList.add('hidden');
            processingCompleteBtn.classList.add('hidden');
        });
    }
    // Start conversion timer
    // Start conversion timer
    startConversionTimer() {
        let seconds = 0;imer = setInterval(() => {
        this.conversionTimer = setInterval(() => {
            seconds++;tes = Math.floor(seconds / 60);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
            const timeString = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
            const timerElement = document.getElementById('conversion-timer');
            const timerElement = document.getElementById('conversion-timer');
            if (timerElement) {xtContent = timeString;
                timerElement.textContent = timeString;
            }00);
        }, 1000);
    }
    // Stop conversion timer
    // Stop conversion timer
    stopConversionTimer() {Timer) {
        if (this.conversionTimer) {ersionTimer);
            clearInterval(this.conversionTimer);
            this.conversionTimer = null;
        }
    }
    // Handle transcription import for a specific project
    // Handle transcription import for a specific projectctId) {
    async handleTranscriptionImportForProject(file, projectId) {
        if (!file) return;
        try {
        try {onst text = await file.text();
            const text = await file.text();getProject(projectId);
            const project = projectManager.getProject(projectId);
            if (project) {
            if (project) {project with transcription
                // Update project with transcriptionId, { 
                projectManager.updateProject(projectId, { 
                    transcription: text,ew Date().toISOString(),
                    transcriptionDate: new Date().toISOString(),
                    status: 'completed'
                });
                this.showSuccessMessage('Transcription imported successfully!');
                this.showSuccessMessage('Transcription imported successfully!');
                this.showProjectReview(projectId);
            }ch (error) {
        } catch (error) {rMessage('Failed to import transcription: ' + error.message);
            this.showErrorMessage('Failed to import transcription: ' + error.message);
        }
    }
    // Handle audio file selection
    // Handle audio file selection {
    handleAudioFileSelection(file) {
        if (!file) return;
        const isLocal = this.elements.methodLocal.checked;
        const isLocal = this.elements.methodLocal.checked;
        // Validate based on transcription method
        // Validate based on transcription methodthod(file, isLocal ? 'local' : 'api');
        const errors = this.validateAudioFileByMethod(file, isLocal ? 'local' : 'api');
        if (errors.length > 0) {e(errors.join('\n'));
            this.showErrorMessage(errors.join('\n'));
            this.elements.audioFile.value = '';
            return;
        }
        // Show file info with appropriate message
        // Show file info with appropriate messagefile.size)}`;
        let sizeMessage = `${UTILS.formatFileSize(file.size)}`;
        if (isLocal) {e += ' ✅ No size limit with Local Whisper!';
            sizeMessage += ' ✅ No size limit with Local Whisper!';
        } else if (file.size > CONFIG.FILES.MAX_FILE_SIZE) {
            sizeMessage += ' ⚠️ Exceeds 25MB API limit';
        }
        this.showInfoMessage(`Selected: ${file.name} (${sizeMessage})`);
        this.showInfoMessage(`Selected: ${file.name} (${sizeMessage})`);
    }
    // Validate audio file based on transcription method
    // Validate audio file based on transcription method {
    validateAudioFileByMethod(file, transcriptionMethod) {
        const errors = [];
        if (!UTILS.isValidAudioFile(file)) {
        if (!UTILS.isValidAudioFile(file)) {ORTED_FORMAT);
            errors.push(CONFIG.ERRORS.UNSUPPORTED_FORMAT);
        }
        // Only check file size for API method
        // Only check file size for API methodUTILS.isValidFileSize(file)) {
        if (transcriptionMethod === 'api' && !UTILS.isValidFileSize(file)) {
            errors.push(CONFIG.ERRORS.FILE_TOO_LARGE);
        }
        return errors;
        return errors;
    }
    // Reset create project form
    // Reset create project form
    resetCreateForm() {has been replaced with instructions, restore the original form
        // If the form has been replaced with instructions, restore the original form
        if (!document.getElementById('create-project-form')) {
            this.restoreOriginalCreateForm();
        } else {.elements.createProjectForm.reset();
            this.elements.createProjectForm.reset();ly
            // Clear the audio file input specificallyById('project-audio-file');
            const audioFileInput = document.getElementById('project-audio-file');
            if (audioFileInput) {lue = '';
                audioFileInput.value = '';
            }
        }
    }
    // Restore the original create project form
    // Simple reset create form without rebinding events
    resetCreateFormSimple() {`
        const form = document.getElementById('create-project-form');ounded-lg shadow-md p-6">
        if (form) {-800 mb-6">Create New Project</h2>
            form.reset();
            console.log('✅ Create form reset');<form id="create-project-form" class="space-y-6">
        } else {
            console.warn('⚠️ Create form not found');label for="project-name" class="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
        }
    }ray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">

    // Restore the original create project form
    restoreOriginalCreateForm() {                    <div>
        const originalFormHTML = `label for="assigned-to" class="block text-sm font-medium text-gray-700 mb-2">Assigned To (Optional)</label>
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-2xl font-semibold text-gray-800 mb-6">Create New Project</h2>r border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                
                <form id="create-project-form" class="space-y-6">
                    <div>                    <div>
                        <label for="project-name" class="block text-sm font-medium text-gray-700 mb-2">Project Name</label>label for="audio-file" class="block text-sm font-medium text-gray-700 mb-2">Audio File</label>
                        <input type="text" id="project-name" required 
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>

                    <div>                    <!-- Transcription Method Selection -->
                        <label for="assigned-to" class="block text-sm font-medium text-gray-700 mb-2">Assigned To (Optional)</label>
                        <input type="text" id="assigned-to" label class="block text-sm font-medium text-gray-700 mb-3">Transcription Method</label>
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>ems-center">
hod-local" name="transcription-method" value="local" checked
                    <div>
                        <label for="audio-file" class="block text-sm font-medium text-gray-700 mb-2">Audio File</label>-700">
                        <input type="file" id="audio-file" accept="audio/*" 
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>

                    <!-- Transcription Method Selection -->lass="flex items-center">
                    <div>hod-api" name="transcription-method" value="api"
                        <label class="block text-sm font-medium text-gray-700 mb-3">Transcription Method</label>
                        <div class="space-y-3">00">
                            <div class="flex items-center">
                                <input type="radio" id="method-local" name="transcription-method" value="local" checked
                                       class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300">
                                <label for="method-local" class="ml-3 block text-sm font-medium text-gray-700">
                                    <span class="font-semibold text-green-600">Local Whisper</span> 
                                    <span class="text-gray-500">(Free, Unlimited, Private)</span>
                                </label>
                            </div>                    <!-- Local Whisper Options (shown when local is selected) -->
                            <div class="flex items-center">der-green-200 rounded-lg p-4">
                                <input type="radio" id="method-api" name="transcription-method" value="api"
                                       class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300">
                                <label for="method-api" class="ml-3 block text-sm font-medium text-gray-700">
                                    <span class="font-semibold text-blue-600">OpenAI API</span> label for="whisper-model" class="block text-sm font-medium text-gray-700 mb-1">Model Quality</label>
                                    <span class="text-gray-500">(25MB limit, Costs money)</span>ring-green-500">
                                </label>
                            </div>
                        </div>ption>
                    </div>

                    <!-- Local Whisper Options (shown when local is selected) -->
                    <div id="local-whisper-options" class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 class="font-semibold text-green-800 mb-3">Local Whisper Settings</h4>label for="whisper-language" class="block text-sm font-medium text-gray-700 mb-1">Language</label>
                        <div class="grid grid-cols-2 gap-4">ocus:ring-green-500">
                            <div>
                                <label for="whisper-model" class="block text-sm font-medium text-gray-700 mb-1">Model Quality</label>>
                                <select id="whisper-model" class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500">
                                    <option value="medium">Medium (Recommended)</option>
                                    <option value="small">Small (Faster)</option>
                                    <option value="large">Large (Best Quality)</option>
                                    <option value="tiny">Tiny (Testing)</option>
                                </select>                    <!-- API Options (shown when API is selected) -->
                            </div>rder-blue-200 rounded-lg p-4 hidden">
                            <div>
                                <label for="whisper-language" class="block text-sm font-medium text-gray-700 mb-1">Language</label>
                                <select id="whisper-language" class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500">label for="api-key" class="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                    <option value="English">English</option>
                                    <option value="auto">Auto-detect</option>focus:ring-blue-500">
                                </select>
                            </div>
                        </div>
                    </div>                    <div class="flex space-x-4">
ass="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors">
                    <!-- API Options (shown when API is selected) -->
                    <div id="api-options" class="bg-blue-50 border border-blue-200 rounded-lg p-4 hidden">
                        <h4 class="font-semibold text-blue-800 mb-3">OpenAI API Settings</h4>ype="button" id="btn-cancel-create" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors">
                        <div>
                            <label for="api-key" class="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                            <input type="password" id="api-key" placeholder="Enter your OpenAI API key"
                                   class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>

                    <div class="flex space-x-4">this.elements.viewCreate.innerHTML = originalFormHTML;
                        <button type="submit" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors">
                            Create Project// Re-cache elements and re-bind events
                        </button>
                        <button type="button" id="btn-cancel-create" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors">ents();
                            Cancel
                        </button>
                    </div>    // Bind events specific to the create form
                </form>
            </div>rm
        `;ojectForm.addEventListener('submit', (e) => {
        
        this.elements.viewCreate.innerHTML = originalFormHTML;oject();
        
        // Re-cache elements and re-bind events
        this.cacheElements();        this.elements.btnCancelCreate.addEventListener('click', () => {
        this.bindCreateFormEvents();
    }');

    // Bind events specific to the create form
    bindCreateFormEvents() {        // Audio file selection
        // Create project form.addEventListener('change', (e) => {
        this.elements.createProjectForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateProject();
        });        // Transcription method selection
tListener('change', () => {
        this.elements.btnCancelCreate.addEventListener('click', () => {
            this.resetCreateForm();
            this.showView('projects');
        });this.elements.methodApi.addEventListener('change', () => {

        // Audio file selection
        this.elements.audioFile.addEventListener('change', (e) => {
            this.handleAudioFileSelection(e.target.files[0]);
        });    // Refresh projects list

        // Transcription method selectionthis.elements.searchProjects.value;
        this.elements.methodLocal.addEventListener('change', () => {
            this.toggleTranscriptionOptions();cts(searchTerm) : 
        });
        
        this.elements.methodApi.addEventListener('change', () => {        this.renderProjectsList(projects);
            this.toggleTranscriptionOptions();
        });
    }    // Render projects list
ects) {
    // Refresh projects list {
    refreshProjectsList() {st.innerHTML = this.getEmptyProjectsHTML();
        const searchTerm = this.elements.searchProjects.value;
        const projects = searchTerm ? 
            projectManager.searchProjects(searchTerm) : 
            projectManager.getAllProjects();        const projectsHTML = projects.map(project => this.getProjectCardHTML(project)).join('');

        this.renderProjectsList(projects);
    }        // Bind project click events

    // Render projects list
    renderProjectsList(projects) {
        if (projects.length === 0) {    // Get HTML for empty projects state
            this.elements.projectsList.innerHTML = this.getEmptyProjectsHTML();
            return;
        } class="text-center py-12">
ext-6xl mb-4">🎵</div>
        const projectsHTML = projects.map(project => this.getProjectCardHTML(project)).join('');-2">No Projects Found</h3>
        this.elements.projectsList.innerHTML = projectsHTML;oject.</p>
on-colors" 
        // Bind project click events
        this.bindProjectEvents();
    }

    // Get HTML for empty projects state
    getEmptyProjectsHTML() {
        return `
            <div class="text-center py-12">    // Get HTML for project card
                <div class="text-gray-400 text-6xl mb-4">🎵</div>{
                <h3 class="text-lg font-semibold text-gray-600 mb-2">No Projects Found</h3>getStatusClass(project.status);
                <p class="text-gray-500 mb-4">Start by creating your first transcription project with PALAScribe.</p>
                <button class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors" .NEW;
                        onclick="uiController.showView('create')">US.PROCESSING;
                    Create New Project;
                </button>
            </div>
        `;        return `
    } class="project-card" data-project-id="${project.id}">

    // Get HTML for project card>${this.escapeHtml(project.name)}</h3>
    getProjectCardHTML(project) {
        const statusClass = this.getStatusClass(project.status);
        const statusText = this.getStatusText(project.status);
        const isNew = project.status === CONFIG.PROJECT_STATUS.NEW;<div class="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
        const isProcessing = project.status === CONFIG.PROJECT_STATUS.PROCESSING;
        const needsReview = project.status === CONFIG.PROJECT_STATUS.NEEDS_REVIEW;span class="font-medium">Created:</span> 
        const isApproved = project.status === CONFIG.PROJECT_STATUS.APPROVED;

        return `
            <div class="project-card" data-project-id="${project.id}">span class="font-medium">Assigned:</span> 
                <div class="flex justify-between items-start mb-3">
                    <h3 class="font-semibold text-lg text-gray-800">${this.escapeHtml(project.name)}</h3>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                                ${project.audioFileName ? `
                <div class="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">t-gray-600 mb-3">
                    <div>an> ${this.escapeHtml(project.audioFileName)}
                        <span class="font-medium">Created:</span> 
                        ${UTILS.formatDate(project.created)}
                    </div>
                    <div>                ${isNew ? `
                        <span class="font-medium">Assigned:</span> ass="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
                        ${project.assignedTo || 'Unassigned'}
                    </div>w Details" to attach an audio file
                </div>

                ${project.audioFileName ? `
                    <div class="text-sm text-gray-600 mb-3">
                        <span class="font-medium">Audio:</span> ${this.escapeHtml(project.audioFileName)}                ${project.error ? `
                    </div>red-50 border border-red-200 rounded-lg p-3 mb-3">
                ` : ''}
.escapeHtml(project.error)}
                ${isNew ? `
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
                        <div class="text-yellow-700 text-sm">
                            <strong>Next:</strong> Click "View Details" to attach an audio file
                        </div>                <div class="flex space-x-2">
                    </div>w-project bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                ` : ''}
ails'}
                ${project.error ? `
                    <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                        <div class="text-red-700 text-sm">${isProcessing ? `
                            <strong>Error:</strong> ${this.escapeHtml(project.error)}ext-blue-600 px-3 py-1 text-sm font-medium">
                        </div>
                    </div>
                ` : ''}

                <div class="flex space-x-2">${needsReview ? `
                    <button class="btn-review-project bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"text-yellow-600 px-3 py-1 text-sm font-medium">
                            data-project-id="${project.id}">
                        ${isNew ? 'Attach Audio' : 'View Details'}
                    </button>
                    
                    ${isProcessing ? `${isApproved ? `
                        <span class="text-blue-600 px-3 py-1 text-sm font-medium">"text-green-600 px-3 py-1 text-sm font-medium">
                            🔄 Processing...
                        </span>
                    ` : ''}
                    
                    ${needsReview ? `<button class="btn-delete-project bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        <span class="text-yellow-600 px-3 py-1 text-sm font-medium">
                            👀 Needs Review
                        </span>
                    ` : ''}
                    
                    ${isApproved ? `
                        <span class="text-green-600 px-3 py-1 text-sm font-medium">
                            ✅ Approved
                        </span>    // Bind project-specific events
                    ` : ''}
                    etails
                    <button class="btn-delete-project bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"ll('.btn-review-project').forEach(btn => {
                            data-project-id="${project.id}">
                        Delete.projectId;
                    </button>
                </div>
            </div>
        `;
    }        // Removed convert audio button handlers - processing is now automatic

    // Bind project-specific events        // Start review
    bindProjectEvents() {electorAll('.btn-start-review').forEach(btn => {
        // View project details
        document.querySelectorAll('.btn-review-project').forEach(btn => {.projectId;
            btn.addEventListener('click', (e) => {
                const projectId = e.target.dataset.projectId;
                this.showProjectReview(projectId);
            });
        });        // Delete project
ectorAll('.btn-delete-project').forEach(btn => {
        // Removed convert audio button handlers - processing is now automatic
.projectId;
        // Start review
        document.querySelectorAll('.btn-start-review').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = e.target.dataset.projectId;
                this.handleStartReview(projectId);
            });    // Handle audio conversion
        });rojectId) {

        // Delete projecthis.showModal('loading');
        document.querySelectorAll('.btn-delete-project').forEach(btn => {
            btn.addEventListener('click', (e) => {const result = await projectManager.convertAudio(projectId);
                const projectId = e.target.dataset.projectId;
                this.handleDeleteProject(projectId);this.hideModal('loading');
            });
        });if (result.success) {
    }essage(CONFIG.SUCCESS.TRANSCRIPTION_COMPLETE);

    // Handle audio conversion
    async handleConvertAudio(projectId) {.showErrorMessage(result.error);
        try {
            this.showModal('loading');
                    } catch (error) {
            const result = await projectManager.convertAudio(projectId);l('loading');
            r.message);
            this.hideModal('loading');
            
            if (result.success) {
                this.showSuccessMessage(CONFIG.SUCCESS.TRANSCRIPTION_COMPLETE);    // Handle attaching audio file to a project
                this.refreshProjectsList();oFile, transcriptionMethod, previewMode = false) {
            } else {
                this.showErrorMessage(result.error);/ Validate the audio file based on transcription method
            }(audioFile, transcriptionMethod);

        } catch (error) {onErrors.join(', '));
            this.hideModal('loading');
            this.showErrorMessage(error.message);
        }
    }            // Attach the audio file to the project with preview mode setting
le, transcriptionMethod, previewMode);
    // Handle attaching audio file to a project
    async handleAttachAudioFile(projectId, audioFile, transcriptionMethod, previewMode = false) {const previewText = previewMode ? ' (Preview mode - processing first 60 seconds)' : '';
        try {ssing...`);
            // Validate the audio file based on transcription method
            const validationErrors = AudioFileValidator.validateFile(audioFile, transcriptionMethod);// Auto-start processing immediately
            if (validationErrors.length > 0) {
                this.showErrorMessage(validationErrors.join(', '));erateText(projectId);
                return;cess message
            }
tch (error) {
            // Attach the audio file to the project with preview mode settingrMessage(error.message);
            const project = projectManager.attachAudioFile(projectId, audioFile, transcriptionMethod, previewMode);
            
            const previewText = previewMode ? ' (Preview mode - processing first 60 seconds)' : '';
            this.showSuccessMessage(`Audio file attached successfully!${previewText} Starting processing...`);    // Handle start review
            ectId) {
            // Auto-start processing immediately
            setTimeout(() => {rojectManager.startReview(projectId);
                this.handleGenerateText(projectId);
            }, 500); // Small delay to show the success message
            rMessage(error.message);
        } catch (error) {
            this.showErrorMessage(error.message);
        }
    }    // Handle delete project
ectId) {
    // Handle start reviewer.getProject(projectId);
    handleStartReview(projectId) {
        try {
            projectManager.startReview(projectId);        if (confirm(`Are you sure you want to delete project "${project.name}"?`)) {
            this.showProjectReview(projectId);
        } catch (error) {rojectManager.deleteProject(projectId);
            this.showErrorMessage(error.message);
        }oject deleted successfully');
    }
rMessage(error.message);
    // Handle delete project
    handleDeleteProject(projectId) {
        const project = projectManager.getProject(projectId);
        if (!project) return;
    // Show project review view
        if (confirm(`Are you sure you want to delete project "${project.name}"?`)) {) {
            try {ager.getProject(projectId);
                projectManager.deleteProject(projectId);
                this.refreshProjectsList();rorMessage(CONFIG.ERRORS.PROJECT_NOT_FOUND);
                this.showSuccessMessage('Project deleted successfully');
            } catch (error) {
                this.showErrorMessage(error.message);
            }        this.currentProject = project;
        }ct);
    }

    // Show project review view
    showProjectReview(projectId) {    // Render project review
        const project = projectManager.getProject(projectId);ect) {
        if (!project) {etStatusClass(project.status);
            this.showErrorMessage(CONFIG.ERRORS.PROJECT_NOT_FOUND);
            return;
        }const reviewHTML = `
e-y-6">
        this.currentProject = project;b pb-4">
        this.renderProjectReview(project);y-between items-start mb-4">
        this.showView('review');this.escapeHtml(project.name)}</h3>
    }

    // Render project review
    renderProjectReview(project) {<div class="grid grid-cols-2 gap-4 text-sm text-gray-600">
        const statusClass = this.getStatusClass(project.status);ect.created)}</div>
        const statusText = this.getStatusText(project.status);/div>
        
        const reviewHTML = `
            <div class="space-y-6">
                <div class="border-b pb-4">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-2xl font-bold text-gray-800">${this.escapeHtml(project.name)}</h3>                ${this.getProjectActionsHTML(project)}
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div><strong>Created:</strong> ${UTILS.formatDate(project.created)}</div>        this.elements.projectDetails.innerHTML = reviewHTML;
                        <div><strong>Assigned To:</strong> ${project.assignedTo || 'Unassigned'}</div>
                        <div><strong>Audio File:</strong> ${project.audioFileName || 'None'}</div>// Use setTimeout to ensure DOM elements are ready
                        <div><strong>Status:</strong> ${statusText}</div>
                    </div>ctReviewEvents(project);
                </div>

                ${this.getProjectActionsHTML(project)}
                ${this.getProjectContentHTML(project)}    // Get project actions HTML
            </div>ct) {
        `;s="flex flex-wrap gap-2 mb-6">';

        this.elements.projectDetails.innerHTML = reviewHTML;        // State: NEW - Allow attaching audio file
        US.NEW) {
        // Use setTimeout to ensure DOM elements are ready
        setTimeout(() => {space-y-4">
            this.bindProjectReviewEvents(project);ems-center space-x-4">
        }, 100);
    }input type="file" id="attach-audio-file" accept="audio/*" class="hidden">
ite px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
    // Get project actions HTML
    getProjectActionsHTML(project) {dio File</span>
        let actionsHTML = '<div class="flex flex-wrap gap-2 mb-6">';

        // State: NEW - Allow attaching audio file
        if (project.status === CONFIG.PROJECT_STATUS.NEW) {label class="block text-sm font-medium text-gray-700 mb-1">Transcription Method:</label>
            actionsHTML += `lg focus:ring-2 focus:ring-blue-500">
                <div class="space-y-4">
                    <div class="flex items-center space-x-4">
                        <div>
                            <input type="file" id="attach-audio-file" accept="audio/*" class="hidden">
                            <button id="btn-attach-audio" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
                                <span>📎</span>
                                <span>Attach Audio File</span><!-- Preview Mode Option -->
                            </button>der border-yellow-200 rounded-lg p-3">
                        </div>
                        <div>4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Transcription Method:</label>
                            <select id="transcription-method-select" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">REVIEW.DURATION_SECONDS} seconds for testing)
                                <option value="local">Local Whisper (Recommended)</option>
                                <option value="api">OpenAI API</option>
                            </select>ss="text-xs text-yellow-700 mt-1">
                        </div> much faster processing
                    </div>
                    
                    <!-- Preview Mode Option -->
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <label class="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" id="preview-mode" class="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500">
                            <span class="text-sm font-medium text-yellow-800">        // Auto-processing: No manual "Generate Text" button needed anymore
                                🔍 Preview Mode (Process only first ${CONFIG.PREVIEW.DURATION_SECONDS} seconds for testing)
                            </span>
                        </label>        // State: PROCESSING - Show progress
                        <div class="text-xs text-yellow-700 mt-1">T_STATUS.PROCESSING) {
                            Perfect for testing with large files - much faster processing
                        </div>w-full">
                    </div> items-center space-x-3 mb-3">
                </div>w-6 border-b-2 border-green-600"></div>
            `;
        }pan>

        // Auto-processing: No manual "Generate Text" button needed anymorelass="w-full bg-gray-200 rounded-full h-3">
        // Processing happens automatically when audio is uploaded-600 h-3 rounded-full transition-all duration-300" style="width: 0%"></div>

        // State: PROCESSING - Show progressd="conversion-status" class="text-sm text-gray-600 mt-2">Initializing...</div>
        if (project.status === CONFIG.PROJECT_STATUS.PROCESSING) {
            actionsHTML += `
                <div class="w-full">
                    <div class="flex items-center space-x-3 mb-3">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>        // State: NEEDS_REVIEW - Show review options and download
                        <span class="text-gray-700 font-medium">Processing audio...</span>) {
                        <span id="conversion-timer" class="text-sm text-gray-500">00:00</span>
                    </div>flex space-x-3">
                    <div class="w-full bg-gray-200 rounded-full h-3">view-detail" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                        <div id="conversion-progress" class="bg-green-600 h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                    <div id="conversion-status" class="text-sm text-gray-600 mt-2">Initializing...</div>d="btn-download-generated" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                </div>
            `;
        }

        // State: NEEDS_REVIEW - Show review options and download
        if (project.status === CONFIG.PROJECT_STATUS.NEEDS_REVIEW) {
            actionsHTML += `        // State: APPROVED - Show final download options
                <div class="flex space-x-3">ROVED) {
                    <button id="btn-start-review-detail" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                        📝 Start Reviewflex space-x-3">
                    </button>-generated" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                    <button id="btn-download-generated" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                        📥 Download Text File
                    </button>.reviewedDocxInfo ? `
                </div>eviewed" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors">
            `;
        }

        // State: APPROVED - Show final download options
        if (project.status === CONFIG.PROJECT_STATUS.APPROVED) {
            actionsHTML += `
                <div class="flex space-x-3">
                    <button id="btn-download-generated" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">        actionsHTML += '</div>';
                        ✅ Download Approved Text
                    </button>
                    ${project.reviewedDocxInfo ? `
                        <button id="btn-download-reviewed" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors">    // Get project content HTML
                            📄 Download Reviewed Documentct) {
                        </button>
                    ` : ''}
                </div>        if (project.error) {
            `;
        }bg-red-50 border border-red-200 rounded-lg p-4 mb-6">

        actionsHTML += '</div>';r)}</p>
        return actionsHTML;
    }

    // Get project content HTML
    getProjectContentHTML(project) {        // Show audio file info if attached
        let contentHTML = '';dioFileName) {

        if (project.error) {tionMethod || 'local';
            contentHTML += `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">contentHTML += `
                    <h4 class="text-red-800 font-semibold mb-2">Error</h4>bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p class="text-red-700">${this.escapeHtml(project.error)}</p>ils</h4>
                </div>
            `;scapeHtml(project.audioFileName)}</div>
        }
Local Whisper' : 'OpenAI API'}</div>
        // Show audio file info if attachedocessing' : 'Attached'}</div>
        if (project.audioFile && project.audioFileName) {
            const fileSize = project.audioFile.size || 0;scriptionMethod === 'local' ? `
            const transcriptionMethod = project.transcriptionMethod || 'local';en-700 font-medium">
            r Mac
            contentHTML += `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 class="text-blue-800 font-semibold mb-3">📁 Audio File Details</h4>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Filename:</strong> ${this.escapeHtml(project.audioFileName)}</div>
                        <div><strong>Size:</strong> ${UTILS.formatFileSize(fileSize)}</div>
                        <div><strong>Method:</strong> ${transcriptionMethod === 'local' ? 'Local Whisper' : 'OpenAI API'}</div>        // Show transcription results if available
                        <div><strong>Status:</strong> ${project.status === CONFIG.PROJECT_STATUS.AUDIO_ASSIGNED ? 'Ready for processing' : 'Attached'}</div>ttedText) {
                    </div>ct.transcription;
                    ${transcriptionMethod === 'local' ? `
                        <div class="mt-3 text-sm text-green-700 font-medium">
                            ✅ No file size limits • Private processing on your MaccontentHTML += `
                        </div>bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    ` : ''}
                </div>ated Text</h4>
            `;
        }text-sm text-gray-600">
scapeHtml(outputPath)}
        // Show transcription results if available
        if (project.transcription || project.formattedText) {
            const textToShow = project.formattedText || project.transcription;
            const outputPath = project.generatedTextPath || '';lass="bg-white border rounded p-4 max-h-96 overflow-y-auto custom-scrollbar">
            Show)}</pre>
            contentHTML += `
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <div class="flex justify-between items-center mb-3">
                        <h4 class="text-gray-800 font-semibold">📝 Generated Text</h4>
                        ${outputPath ? `
                            <div class="text-sm text-gray-600">        // Show project guidance based on state
                                <strong>File:</strong> ${this.escapeHtml(outputPath)}TATUS.NEW) {
                            </div>
                        ` : ''}bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    </div>h4>
                    <div class="bg-white border rounded p-4 max-h-96 overflow-y-auto custom-scrollbar">
                        <pre class="whitespace-pre-wrap text-sm text-gray-700">${this.escapeHtml(textToShow)}</pre>ically start transcription. 
                    </div>
                </div>
            `;
        }
 if (project.status === CONFIG.PROJECT_STATUS.PROCESSING) {
        // Show project guidance based on state
        if (project.status === CONFIG.PROJECT_STATUS.NEW) {bg-blue-50 border border-blue-200 rounded-lg p-4">
            contentHTML += `/h4>
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 class="text-yellow-800 font-semibold mb-2">📋 Next Steps</h4>essed. Please wait for completion.
                    <p class="text-yellow-700 text-sm">
                        Attach an audio file to automatically start transcription. 
                        Processing will begin immediately after upload.
                    </p> if (project.status === CONFIG.PROJECT_STATUS.NEEDS_REVIEW) {
                </div>
            `;bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        } else if (project.status === CONFIG.PROJECT_STATUS.PROCESSING) {ed</h4>
            contentHTML += `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">ds review before approval. Click "Start Review" to edit and approve the transcription.
                    <h4 class="text-blue-800 font-semibold mb-2">⚡ Processing</h4>
                    <p class="text-blue-700 text-sm">
                        Your audio file is being processed. Please wait for completion.
                    </p> if (project.status === CONFIG.PROJECT_STATUS.APPROVED) {
                </div>
            `;bg-green-50 border border-green-200 rounded-lg p-4">
        } else if (project.status === CONFIG.PROJECT_STATUS.NEEDS_REVIEW) {>
            contentHTML += `
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">approved. Download the final text file.
                    <h4 class="text-yellow-800 font-semibold mb-2">� Review Required</h4>eviewedBy}` : ''}
                    <p class="text-yellow-700 text-sm">
                        Text has been generated and needs review before approval. Click "Start Review" to edit and approve the transcription.
                    </p>
                </div>
            `;
        } else if (project.status === CONFIG.PROJECT_STATUS.APPROVED) {        return contentHTML;
            contentHTML += `
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 class="text-green-800 font-semibold mb-2">✅ Approved</h4>    // Bind project review events
                    <p class="text-green-700 text-sm">ct) {
                        Project has been reviewed and approved. Download the final text file.e
                        ${project.reviewedBy ? `<br><strong>Reviewed by:</strong> ${project.reviewedBy}` : ''}.getElementById('btn-attach-audio');
                    </p>);
                </div>ion-method-select');
            `;
        }if (attachAudioBtn && attachAudioFile) {
ck', (e) => {
        return contentHTML;
    }ck();

    // Bind project review events
    bindProjectReviewEvents(project) {            attachAudioFile.addEventListener('change', (e) => {
        // NEW state: Attach audio file
        const attachAudioBtn = document.getElementById('btn-attach-audio');
        const attachAudioFile = document.getElementById('attach-audio-file');ethod = transcriptionMethodSelect ? transcriptionMethodSelect.value : 'local';
        const transcriptionMethodSelect = document.getElementById('transcription-method-select');
        
        if (attachAudioBtn && attachAudioFile) {
            attachAudioBtn.addEventListener('click', (e) => {
                e.preventDefault();
                attachAudioFile.click();
            });        // AUDIO_ASSIGNED state: Generate text
ementById('btn-generate-text');
            attachAudioFile.addEventListener('change', (e) => {
                const file = e.target.files[0];dEventListener('click', () => this.handleGenerateText(project.id));
                if (file) {
                    const method = transcriptionMethodSelect ? transcriptionMethodSelect.value : 'local';
                    const previewMode = document.getElementById('preview-mode')?.checked || false;        // Legacy convert button (keeping for backward compatibility)
                    this.handleAttachAudioFile(project.id, file, method, previewMode);-review');
                }
            });dEventListener('click', () => this.handleGenerateText(project.id));
        }

        // AUDIO_ASSIGNED state: Generate text        // READY_FOR_REVIEW state: Start review and download
        const generateTextBtn = document.getElementById('btn-generate-text');start-review-detail');
        if (generateTextBtn) {ed');
            generateTextBtn.addEventListener('click', () => this.handleGenerateText(project.id));
        }        if (startReviewBtn) {
dEventListener('click', () => {
        // Legacy convert button (keeping for backward compatibility)
        const convertBtn = document.getElementById('btn-convert-audio-review');
        if (convertBtn) {
            convertBtn.addEventListener('click', () => this.handleGenerateText(project.id));
        }        if (downloadGeneratedBtn) {
dEventListener('click', () => {
        // READY_FOR_REVIEW state: Start review and download
        const startReviewBtn = document.getElementById('btn-start-review-detail');
        const downloadGeneratedBtn = document.getElementById('btn-download-generated');

        if (startReviewBtn) {        // Simplified workflow - removed complex review handlers
            startReviewBtn.addEventListener('click', () => {
                this.showReviewInterface(project.id);
            });    // Handle review interface showing
        }
er.getProject(projectId);
        if (downloadGeneratedBtn) {
            downloadGeneratedBtn.addEventListener('click', () => {rorMessage('Project not found');
                this.handleDownloadGeneratedText(project.id);
            });
        }
        // Create a modal or overlay for reviewing
        // Simplified workflow - removed complex review handlers('div');
    }-opacity-50 flex items-center justify-center z-50';

    // Handle review interface showingrounded-lg shadow-xl max-w-6xl max-h-5/6 w-full mx-4 overflow-hidden">
    showReviewInterface(projectId) {
        const project = projectManager.getProject(projectId);ray-900">📝 Review Transcription - ${project.name}</h3>
        if (!project) {t segments to jump to specific timestamps.</p>
            this.showErrorMessage('Project not found');
            return;lass="flex h-full max-h-96">
        }
rder-gray-200 p-4 bg-gray-50">
        // Create a modal or overlay for reviewing
        const reviewModal = document.createElement('div');t-sm font-semibold text-gray-700 mb-3">🎵 Audio Player</h4>
        reviewModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        reviewModal.innerHTML = `udio-player" controls class="w-full mb-3">
            <div class="bg-white rounded-lg shadow-xl max-w-6xl max-h-5/6 w-full mx-4 overflow-hidden">ype="${project.audioFile.type}">
                <div class="bg-gray-50 px-6 py-4 border-b">
                    <h3 class="text-lg font-semibold text-gray-900">📝 Review Transcription - ${project.name}</h3>
                    <p class="text-sm text-gray-600 mt-1">Listen to audio and edit the transcription. Click on text segments to jump to specific timestamps.</p>ss="text-xs text-gray-500">
                </div>roject.audioFileName}</div>
                <div class="flex h-full max-h-96">audioFile.size)}</div>
                    <!-- Audio Player Section -->
                    <div class="w-1/3 border-r border-gray-200 p-4 bg-gray-50">
                        <div class="mb-4">div class="text-sm text-gray-500 text-center p-4 border border-gray-300 rounded">
                            <h4 class="text-sm font-semibold text-gray-700 mb-3">🎵 Audio Player</h4>
                            ${project.audioFile ? `
                                <audio id="review-audio-player" controls class="w-full mb-3">
                                    <source src="${URL.createObjectURL(project.audioFile)}" type="${project.audioFile.type}">
                                    Your browser does not support the audio element.
                                </audio><!-- Audio Controls -->
                                <div class="text-xs text-gray-500">
                                    <div><strong>File:</strong> ${project.audioFileName}</div>ems-center space-x-2">
                                    <div><strong>Size:</strong> ${this.formatFileSize(project.audioFile.size)}</div>-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                                </div>
                            ` : `
                                <div class="text-sm text-gray-500 text-center p-4 border border-gray-300 rounded">d="btn-rewind" class="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm">
                                    Audio file not available
                                </div>
                            `}d="btn-forward" class="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm">
                        </div>
                        
                        <!-- Audio Controls -->
                        <div class="space-y-2">lass="text-xs text-gray-600">
                            <div class="flex items-center space-x-2">pan> / <span id="total-time">0:00</span>
                                <button id="btn-play-pause" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                                    ▶️ Play
                                </button>
                                <button id="btn-rewind" class="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"><!-- Reviewer Info -->
                                    ⏪ -10s
                                </button>block text-sm font-medium text-gray-700 mb-2">Reviewer Name (Optional):</label>
                                <button id="btn-forward" class="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm">
                                    ⏩ +10se="text" 
                                </button>-name" 
                            </div>order border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            <div class="text-xs text-gray-600">
                                <span id="current-time">0:00</span> / <span id="total-time">0:00</span>
                            </div>>
                        </div>
                        
                        <!-- Reviewer Info --><!-- Text Review Section -->
                        <div class="mt-6">ow-y-auto">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Reviewer Name (Optional):</label>en items-center">
                            <input 
                                type="text" label class="block text-sm font-medium text-gray-700 mb-2">Generated Text:</label>
                                id="reviewer-name" 
                                class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"t to jump to that audio position
                                placeholder="Enter your name..."
                            >
                        </div>n id="toggle-edit-mode" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                    </div>
                    
                    <!-- Text Review Section -->
                    <div class="w-2/3 p-4 overflow-y-auto">
                        <div class="mb-3 flex justify-between items-center"><!-- Audio Progress Indicator -->
                            <div>ded-full h-2 relative">
                                <label class="block text-sm font-medium text-gray-700 mb-2">Generated Text:</label>rounded-full transition-all duration-200" style="width: 0%"></div>
                                <div class="text-xs text-gray-500 mb-2">o start</span></div>
                                    💡 Tip: Click on any part of the text to jump to that audio position
                                </div>
                            </div><div 
                            <button id="toggle-edit-mode" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">d="review-text-container" 
                                📝 Edit Modeer border-gray-300 rounded-lg overflow-y-auto bg-white"
                            </button>
                        </div>   <div 
                        d="review-text" 
                        <!-- Audio Progress Indicator -->ne text-sm leading-relaxed min-h-full"
                        <div class="mb-3 bg-gray-200 rounded-full h-2 relative">
                            <div id="audio-progress-bar" class="bg-blue-500 h-2 rounded-full transition-all duration-200" style="width: 0%"></div>hTimestamps(project.transcription || '', project.timestamps || [])}</div>
                            <div id="audio-progress-text" class="text-xs text-gray-600 mt-1">Current: <span id="current-segment-text">Click play to start</span></div>
                        </div>lass="text-xs text-gray-500 mt-2">
                        t Mode" to make changes, or select text normally to copy.</span>
                        <div 
                            id="review-text-container" 
                            class="w-full h-80 p-3 border border-gray-300 rounded-lg overflow-y-auto bg-white"
                        >lass="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
                            <div 
                                id="review-text"  as you edit
                                class="outline-none text-sm leading-relaxed min-h-full"
                                contenteditable="false"lass="flex space-x-3">
                            >${this.formatSimpleTextWithTimestamps(project.transcription || '', project.timestamps || [])}</div>eview" class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                        </div>
                        <div class="text-xs text-gray-500 mt-2">
                            <span id="edit-mode-hint">Click "Edit Mode" to make changes, or select text normally to copy.</span>d="btn-approve-project" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors font-semibold">
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
                    <div class="text-sm text-gray-600">
                        Changes are saved automatically as you edit
                    </div>
                    <div class="flex space-x-3">        document.body.appendChild(reviewModal);
                        <button id="btn-cancel-review" class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                            Cancel        // Add event listeners
                        </button>ewModal.querySelector('#btn-cancel-review');
                        <button id="btn-approve-project" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors font-semibold">');
                            ✅ Approve & Complete
                        </button>yer');
                    </div>
                </div>
            </div>
        `;        let isEditMode = false;

        document.body.appendChild(reviewModal);        // Toggle edit mode
{
        // Add event listenersdEventListener('click', () => {
        const cancelBtn = reviewModal.querySelector('#btn-cancel-review');
        const approveBtn = reviewModal.querySelector('#btn-approve-project');able = isEditMode;
        const reviewTextDiv = reviewModal.querySelector('#review-text');
        const audioPlayer = reviewModal.querySelector('#review-audio-player');if (isEditMode) {
        const toggleEditBtn = reviewModal.querySelector('#toggle-edit-mode');.textContent = '👀 View Mode';
        const editModeHint = reviewModal.querySelector('#edit-mode-hint');r:bg-gray-600 text-white px-3 py-1 rounded text-sm';

        let isEditMode = false;

        // Toggle edit modeleEditBtn.textContent = '📝 Edit Mode';
        if (toggleEditBtn) {r:bg-blue-600 text-white px-3 py-1 rounded text-sm';
            toggleEditBtn.addEventListener('click', () => {';
                isEditMode = !isEditMode;
                reviewTextDiv.contentEditable = isEditMode;
                
                if (isEditMode) {
                    toggleEditBtn.textContent = '👀 View Mode';
                    toggleEditBtn.className = 'bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm';        // Audio control event listeners
                    editModeHint.textContent = 'Edit mode active - you can now modify the text directly.';dal, audioPlayer);
                    reviewTextDiv.style.backgroundColor = '#fffbeb'; // Light yellow background
                } else {        // Simple text click handlers
                    toggleEditBtn.textContent = '📝 Edit Mode';reviewModal, audioPlayer);
                    toggleEditBtn.className = 'bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm';
                    editModeHint.textContent = 'Click "Edit Mode" to make changes, or select text normally to copy.';        cancelBtn.addEventListener('click', () => {
                    reviewTextDiv.style.backgroundColor = '#ffffff'; // White background
                }
            });
        }        approveBtn.addEventListener('click', () => {
lector('#reviewer-name').value.trim();
        // Audio control event listeners
        this.setupAudioControls(reviewModal, audioPlayer);
if (!updatedText) {
        // Simple text click handlerseview the text before approving.');
        this.setupSimpleTextHandlers(reviewModal, audioPlayer);

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(reviewModal);            try {
        });/ Update the project with any text edits
) {
        approveBtn.addEventListener('click', () => {{
            const reviewerName = reviewModal.querySelector('#reviewer-name').value.trim();
            const updatedText = reviewTextDiv.innerText.trim();
            
            if (!updatedText) {
                alert('Please review the text before approving.');                // Approve the project
                return;Project(projectId, reviewerName || 'Anonymous');
            }
document.body.removeChild(reviewModal);
            try {ed successfully! ${reviewerName ? `Reviewed by: ${reviewerName}` : ''}`);
                // Update the project with any text edits
                if (updatedText !== project.transcription) {
                    projectManager.updateProject(projectId, {tch (error) {
                        formattedText: updatedTextrMessage(error.message);
                    });
                }

                // Approve the project        // Close on outside click
                projectManager.approveProject(projectId, reviewerName || 'Anonymous');ner('click', (e) => {
                
                document.body.removeChild(reviewModal);eviewModal);
                this.showSuccessMessage(`Project approved successfully! ${reviewerName ? `Reviewed by: ${reviewerName}` : ''}`);
                this.showProjectReview(projectId);
                
            } catch (error) {
                this.showErrorMessage(error.message);    // Setup audio player controls for review interface
            }
        });

        // Close on outside click        const playPauseBtn = modal.querySelector('#btn-play-pause');
        reviewModal.addEventListener('click', (e) => {
            if (e.target === reviewModal) {);
                document.body.removeChild(reviewModal);ime');
            }
        });;
    }
        // Store reference for real-time highlighting
    // Setup audio player controls for review interface
    setupAudioControls(modal, audioPlayer) {ner;
        if (!audioPlayer) return;
        // Play/Pause functionality
        const playPauseBtn = modal.querySelector('#btn-play-pause');
        const rewindBtn = modal.querySelector('#btn-rewind');dEventListener('click', () => {
        const forwardBtn = modal.querySelector('#btn-forward');
        const currentTimeSpan = modal.querySelector('#current-time');
        const totalTimeSpan = modal.querySelector('#total-time');ntent = '⏸️ Pause';
        const textContainer = modal.querySelector('#review-text');
oPlayer.pause();
        // Store reference for real-time highlightingtent = '▶️ Play';
        this.currentAudioPlayer = audioPlayer;
        this.currentTextContainer = textContainer;

        // Play/Pause functionality
        if (playPauseBtn) {        // Rewind 10 seconds
            playPauseBtn.addEventListener('click', () => {
                if (audioPlayer.paused) {dEventListener('click', () => {
                    audioPlayer.play();udioPlayer.currentTime - 10);
                    playPauseBtn.textContent = '⏸️ Pause';
                } else {
                    audioPlayer.pause();
                    playPauseBtn.textContent = '▶️ Play';        // Forward 10 seconds
                }
            });dEventListener('click', () => {
        }Player.duration, audioPlayer.currentTime + 10);

        // Rewind 10 seconds
        if (rewindBtn) {
            rewindBtn.addEventListener('click', () => {        // Update time display and progress indicator
                audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 10); => {
            });
        }xtContent = this.formatTime(audioPlayer.currentTime);

        // Forward 10 seconds
        if (forwardBtn) {// Update progress indicator instead of highlighting
            forwardBtn.addEventListener('click', () => {xtContainer);
                audioPlayer.currentTime = Math.min(audioPlayer.duration, audioPlayer.currentTime + 10);
            });
        }        audioPlayer.addEventListener('loadedmetadata', () => {

        // Update time display and progress indicatorxtContent = this.formatTime(audioPlayer.duration);
        audioPlayer.addEventListener('timeupdate', () => {
            if (currentTimeSpan) {
                currentTimeSpan.textContent = this.formatTime(audioPlayer.currentTime);
            }        // Reset progress indicator when audio ends
             {
            // Update progress indicator instead of highlighting
            this.updateAudioProgress(audioPlayer.currentTime, textContainer);xtContent = '▶️ Play';
        });
/ Reset progress indicator
        audioPlayer.addEventListener('loadedmetadata', () => {
            if (totalTimeSpan) {
                totalTimeSpan.textContent = this.formatTime(audioPlayer.duration);
            }
        });    // Update progress indicator instead of highlighting text

        // Reset progress indicator when audio ends
        audioPlayer.addEventListener('ended', () => {
            if (playPauseBtn) {        const segments = textContainer.querySelectorAll('.text-clickable');
                playPauseBtn.textContent = '▶️ Play';
            }t-text');
            // Reset progress indicator
            this.resetAudioProgress();if (!progressBar || !currentSegmentText) return;
        });
    }        let activeSegment = null;

    // Update progress indicator instead of highlighting text0;
    updateAudioProgress(currentTime, textContainer) {
        if (!textContainer) return;        // Find current segment and calculate progress

        const segments = textContainer.querySelectorAll('.text-clickable');nt.dataset.start) || 0;
        const progressBar = document.getElementById('audio-progress-bar');ime + 1;
        const currentSegmentText = document.getElementById('current-segment-text');
        // Update total duration
        if (!progressBar || !currentSegmentText) return;ion) {

        let activeSegment = null;
        let totalDuration = 0;
        let currentProgress = 0;// Check if current time falls within this segment
Time && !activeSegment) {
        // Find current segment and calculate progress
        segments.forEach((segment, index) => {ntTime / totalDuration) * 100;
            const startTime = parseFloat(segment.dataset.start) || 0;
            const endTime = parseFloat(segment.dataset.end) || startTime + 1;
            
            // Update total duration        // Update progress bar
            if (endTime > totalDuration) {h = `${Math.min(currentProgress, 100)}%`;
                totalDuration = endTime;
            }// Update current segment text
            
            // Check if current time falls within this segmentt = activeSegment.textContent.trim();
            if (currentTime >= startTime && currentTime <= endTime && !activeSegment) {
                activeSegment = segment;egmentText.length > maxLength 
                currentProgress = (currentTime / totalDuration) * 100;
            }
        });.textContent = `"${displayText}"`;

        // Update progress bar// Scroll to active segment if needed
        progressBar.style.width = `${Math.min(currentProgress, 100)}%`;extContainer);
        
        // Update current segment textentSegmentText.textContent = 'No active segment';
        if (activeSegment) {
            const segmentText = activeSegment.textContent.trim();
            const maxLength = 50;
            const displayText = segmentText.length > maxLength     // Scroll to active segment if it's not visible
                ? segmentText.substring(0, maxLength) + '...' 
                : segmentText;n;
            currentSegmentText.textContent = `"${displayText}"`;
                    const containerRect = container.getBoundingClientRect();
            // Scroll to active segment if needed
            this.scrollToSegment(activeSegment, textContainer);
        } else {// Check if segment is outside the visible area
            currentSegmentText.textContent = 'No active segment';entRect.bottom > containerRect.bottom) {
        }
    }

    // Scroll to active segment if it's not visible'
    scrollToSegment(segment, container) {
        if (!segment || !container) return;

        const containerRect = container.getBoundingClientRect();
        const segmentRect = segment.getBoundingClientRect();    // Reset progress indicator
        
        // Check if segment is outside the visible area= document.getElementById('audio-progress-bar');
        if (segmentRect.top < containerRect.top || segmentRect.bottom > containerRect.bottom) {t-text');
            segment.scrollIntoView({
                behavior: 'smooth',if (progressBar) {
                block: 'center',yle.width = '0%';
                inline: 'nearest'
            });
        }if (currentSegmentText) {
    }xtContent = 'Click play to start';

    // Reset progress indicator
    resetAudioProgress() {
        const progressBar = document.getElementById('audio-progress-bar');    // Format text with clickable timestamp segments using real Whisper timestamps
        const currentSegmentText = document.getElementById('current-segment-text');
        
        if (progressBar) {
            progressBar.style.width = '0%';// If no timestamps available, fall back to plain text
        }
         showing plain text');
        if (currentSegmentText) {capeHtml(text)}</span>`;
            currentSegmentText.textContent = 'Click play to start';
        }
    }console.log(`📝 Formatting text with ${timestamps.length} timestamp segments`);

    // Format text with clickable timestamp segments using real Whisper timestamps// Create segments based on actual Whisper timestamps
    formatTextWithTimestamps(text, timestamps = []) {
        if (!text) return '';
        ime + 1;
        // If no timestamps available, fall back to plain text
        if (!timestamps || timestamps.length === 0) {
            console.warn('⚠️ No timestamps available, showing plain text');return `<span class="text-segment" data-timestamp="${startTime}" data-end-timestamp="${endTime}" data-segment-id="${index}" title="Click to jump to ${this.formatTime(startTime)} - ${this.formatTime(endTime)}">${this.escapeHtml(segmentText)}</span>`;
            return `<span class="text-segment" data-timestamp="0">${this.escapeHtml(text)}</span>`;
        }
    // Simple text formatting - no complex highlighting, just clickable segments
    formatSimpleTextWithTimestamps(text, timestamps = []) {
        if (!text) return '';
        
        // If no timestamps available, return plain text
        if (!timestamps || timestamps.length === 0) {
            console.warn('⚠️ No timestamps available, showing plain text');
            return this.escapeHtml(text);
        }
        
        console.log(`📝 Formatting text with ${timestamps.length} timestamp segments`);
        
        // Create simple clickable segments - just basic spans
        return timestamps.map((segment, index) => {
            const startTime = segment.start || 0;
            const endTime = segment.end || startTime + 1;
            const segmentText = segment.text || '';
            
            return `<span class="text-clickable" data-start="${startTime}" data-end="${endTime}" data-index="${index}">${this.escapeHtml(segmentText)}</span>`;
        }).join(' ');
    }
        }).join(' ');
    }   console.log(`📝 Formatting text with ${timestamps.length} timestamp segments`);
        console.log(`📝 Formatting text with ${timestamps.length} timestamp segments`);
    // Simple text formatting with visible timestamps - no highlighting needed
    formatSimpleTextWithTimestamps(text, timestamps = []) {kers
        if (!text) return ''; segment.start || 0;
            const endTime = segment.end || startTime + 1;#review-text');
        // If no timestamps available, return plain text
        if (!timestamps || timestamps.length === 0) {
            console.warn('⚠️ No timestamps available, showing plain text');data-end="${endTime}" data-index="${index}">${this.escapeHtml(segmentText)}</span>`;tainer
            return this.escapeHtml(text);
        };
         return;
        console.log(`📝 Formatting text with ${timestamps.length} timestamp segments`);startTime}" data-end="${endTime}" data-index="${index}">[${timeStamp}]</span> <span class="text-content" data-start="${startTime}" data-end="${endTime}">${this.escapeHtml(segmentText)}</span>`;
        pSimpleTextHandlers(modal, audioPlayer) {
        // Create text with visible timestamp markers
        return timestamps.map((segment, index) => {if (clickedElement && clickedElement.dataset.start) {
            const startTime = segment.start || 0;('#review-text');at(clickedElement.dataset.start);
            const endTime = segment.end || startTime + 1;
            const segmentText = segment.text || '';rrentTime = timestamp;
            dd click event listener to the text container
            // Format timestamp as [MM:SS]ick', (e) => { container.querySelectorAll('.text-content');
            const timeStamp = this.formatTime(startTime);
            if (textContainer.contentEditable === 'true') return;        }
            return `<span class="timestamp-marker" data-start="${startTime}" data-end="${endTime}" data-index="${index}">[${timeStamp}]</span> <span class="text-content" data-start="${startTime}" data-end="${endTime}">${this.escapeHtml(segmentText)}</span>`;
        }).join(' ');
    }       
            if (clickedElement && clickedElement.dataset.start) {
    // Extract text content without timestamp markers for savingoat(clickedElement.dataset.start);    // Simple click to seek functionality    // Show brief visual feedback for clicked segment
    extractTextContent(container) {
        if (!container) return '';urrentTime = timestamp;lement.style.backgroundColor;
                            
        const textElements = container.querySelectorAll('.text-content');        const textContainer = modal.querySelector('#review-text');
        return Array.from(textElements)eedback(clickedElement);
            .map(element => element.textContent.trim())                }
            .join(' ')        // Add click event listener to the text containerstyle.backgroundColor = originalBg;
            .trim();
    }
') return;0);
    // Simple click to seek functionality    // Show brief visual feedback for clicked segment
    setupSimpleTextHandlers(modal, audioPlayer) {         const clickedElement = e.target.closest('.timestamp-marker, .text-content');
        if (!audioPlayer) return;t originalBg = element.style.backgroundColor;
if (clickedElement && clickedElement.dataset.start) {    // Format time in MM:SS format
        const textContainer = modal.querySelector('#review-text');
        if (!textContainer) return;
stamp;
        // Add click event listener to the text containerstyle.backgroundColor = originalBg;
        textContainer.addEventListener('click', (e) => {// Show brief visual feedbackt(2, '0')}`;
            // Only handle clicks when not in edit mode
            if (textContainer.contentEditable === 'true') return;0);
0);
            const clickedElement = e.target.closest('.timestamp-marker, .text-content');
            
            if (clickedElement && clickedElement.dataset.start) {    // Format time in MM:SS format
                const timestamp = parseFloat(clickedElement.dataset.start); // Show brief visual feedback for clicked segmentzes = ['Bytes', 'KB', 'MB', 'GB'];
                if (!isNaN(timestamp)) {rn '0:00';
                    audioPlayer.currentTime = timestamp;es / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                    
                    // Show brief visual feedbackt(2, '0')}`;
                    this.showClickFeedback(clickedElement);
                }setTimeout(() => {{
            }ackgroundColor = originalBg;
        });
    }transition = '';       const project = projectManager.getProject(projectId);
24;
    // Show brief visual feedback for clicked segmentzes = ['Bytes', 'KB', 'MB', 'GB'];
    showClickFeedback(element) {   const i = Math.floor(Math.log(bytes) / Math.log(k));
        const originalBg = element.style.backgroundColor;        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];not found');
        element.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';e in MM:SS format
        element.style.transition = 'background-color 0.2s ease';
        )) return '0:00';
        setTimeout(() => {{ / 60);able' : 'Not available');
            element.style.backgroundColor = originalBg;og('Project formattedText:', project.formattedText ? 'Available' : 'Not available');
            setTimeout(() => {
                element.style.transition = '';       const project = projectManager.getProject(projectId);
            }, 200);            console.log('Project found:', project ? 'Yes' : 'No');
        }, 300); method   return;
    }ject not found');
    // Format time in MM:SS formatturn '0 Bytes';
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';'Bytes', 'KB', 'MB', 'GB'];const textContent = project.formattedText || project.transcription;
        const minutes = Math.floor(seconds / 60);able' : 'Not available');
        const remainingSeconds = Math.floor(seconds % 60);       console.log('Project formattedText:', project.formattedText ? 'Available' : 'Not available');
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }n && !project.formattedText) {
ption available to download');ext            
    // Format file size helper method   return;{
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';onsole.log('Download button clicked for project:', projectId);            const url = URL.createObjectURL(blob);
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];const textContent = project.formattedText || project.transcription;;
        const i = Math.floor(Math.log(bytes) / Math.log(k));xt content length:', textContent.length);
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]; (!project) {.download = filename;
    }ot found');            document.body.appendChild(a);

    // Handle download generated text            
    async handleDownloadGeneratedText(projectId) {
        try {            console.log('Project transcription:', project.transcription ? 'Available' : 'Not available');
            console.log('Download button clicked for project:', projectId);            const url = URL.createObjectURL(blob);
            const project = projectManager.getProject(projectId);
            console.log('Project found:', project ? 'Yes' : 'No');ranscription && !project.formattedText) {
            l;o download');
            if (!project) {.download = filename;
                this.showErrorMessage('Project not found');            document.body.appendChild(a);ile: ' + error.message);
                return;
            }            // Use the transcription or formatted text
|| project.transcription;
            console.log('Project transcription:', project.transcription ? 'Available' : 'Not available');
            console.log('Project formattedText:', project.formattedText ? 'Available' : 'Not available');
downloaded: ${filename}`);const filename = `${project.name}_Generated_Text.txt`;his.searchDebounce);
            if (!project.transcription && !project.formattedText) {
                this.showErrorMessage('No transcription available to download');
                return; Create and download the fileONFIG.UI.SEARCH_DEBOUNCE_TIME);
            }oad text file: ' + error.message);et=utf-8' });

            // Use the transcription or formatted text
            const textContent = project.formattedText || project.transcription;tus) {
            console.log('Text content length:', textContent.length);tus.toLowerCase().replace(/_/g, '-')}`;
            
            const filename = `${project.name}_Generated_Text.txt`;his.searchDebounce);
            console.log('Filename:', filename);() => {    getStatusText(status) {
            );
            // Create and download the fileONFIG.UI.SEARCH_DEBOUNCE_TIME);_STATUS.NEW]: 'New Project',
            const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });sing Audio...',
            const url = URL.createObjectURL(blob);
            ty methods
    getStatusClass(status) {
        return `status-${status.toLowerCase().replace(/_/g, '-')}`;
    }turn statusMap[status] || status.replace(/_/g, ' ');

    getStatusText(status) {
        const statusMap = {    getStatusClass(status) {
            [CONFIG.PROJECT_STATUS.NEW]: 'New Project',
            [CONFIG.PROJECT_STATUS.PROCESSING]: 'Processing Audio...',T_STATUS.NEW]: 'bg-gray-100 text-gray-800',
            [CONFIG.PROJECT_STATUS.NEEDS_REVIEW]: 'Ready for Review',e-800',
            [CONFIG.PROJECT_STATUS.APPROVED]: 'Approved',-800',
            [CONFIG.PROJECT_STATUS.ERROR]: 'Error'
        };
        return statusMap[status] || status.replace(/_/g, ' ');
    }turn classMap[status] || 'bg-gray-100 text-gray-800';

    getStatusClass(status) {
        const classMap = {    escapeHtml(unsafe) {
            [CONFIG.PROJECT_STATUS.NEW]: 'bg-gray-100 text-gray-800',
            [CONFIG.PROJECT_STATUS.PROCESSING]: 'bg-blue-100 text-blue-800',/&/g, "&amp;")
            [CONFIG.PROJECT_STATUS.NEEDS_REVIEW]: 'bg-yellow-100 text-yellow-800',
            [CONFIG.PROJECT_STATUS.APPROVED]: 'bg-green-100 text-green-800',
            [CONFIG.PROJECT_STATUS.ERROR]: 'bg-red-100 text-red-800'")
        };;
        return classMap[status] || 'bg-gray-100 text-gray-800';
    }
    // Modal management
    escapeHtml(unsafe) {
        return unsafe document.getElementById(`${type}-modal`);
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")assList.remove('hidden');
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }    hideModal(type) {
 document.getElementById(`${type}-modal`);
    // Modal management
    showModal(type) {assList.add('hidden');
        const modal = document.getElementById(`${type}-modal`);
        if (modal) {
            modal.classList.remove('hidden');
        }    // Message display
    }(message) {
age.textContent = message;
    hideModal(type) {
        const modal = document.getElementById(`${type}-modal`);
        if (modal) {
            modal.classList.add('hidden');    showErrorMessage(message) {
        }}`); // Simple error display
    }

    // Message display    showInfoMessage(message, timeout = 5000) {
    showSuccessMessage(message) {ment
        this.elements.successMessage.textContent = message;('info-notification');
        this.showModal('success');
    }ocument.createElement('div');

    showErrorMessage(message) {right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md';
        alert(`Error: ${message}`); // Simple error display
    }

    showInfoMessage(message, timeout = 5000) {notification.textContent = message;
        // Create or update a notification element';
        let notification = document.getElementById('info-notification');
        if (!notification) {// Auto-hide after timeout
            notification = document.createElement('div');
            notification.id = 'info-notification';on && notification.parentNode) {
            notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md';
            document.body.appendChild(notification);
        }meout);
        
        notification.textContent = message;
        notification.style.display = 'block';    // Keyboard shortcuts
        ts(e) {
        // Auto-hide after timeoutey) {
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.style.display = 'none';ventDefault();
            }te');
        }, timeout);
    }
ventDefault();
    // Keyboard shortcutsects');
    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'n':
                    e.preventDefault();        if (e.key === 'Escape') {
                    this.showView('create');ng');
                    break;
                case 'p':
                    e.preventDefault();
                    this.showView('projects');
                    break;    // Local Whisper Methods
            }
        }= [];
ds();
        if (e.key === 'Escape') {
            this.hideModal('loading');
            this.hideModal('success');    handleLocalFilesSelected(files) {
        }om(files).filter(file => {
    }

    // Local Whisper Methods
    initializeLocalView() {        if (this.selectedFiles.length > 0) {
        this.selectedFiles = [];
        this.updateWhisperCommands();d ${this.selectedFiles.length} audio file(s)`);
    }
.showErrorMessage('No valid audio files selected');
    handleLocalFilesSelected(files) {
        this.selectedFiles = Array.from(files).filter(file => {
            return UTILS.isValidAudioFile(file);
        });    updateWhisperCommands() {
isperCommands || !this.selectedFiles) return;
        if (this.selectedFiles.length > 0) {
            this.updateWhisperCommands();        if (this.selectedFiles.length === 0) {
            this.showInfoMessage(`Selected ${this.selectedFiles.length} audio file(s)`);rHTML = '<div class="text-gray-400 mb-2"># Select files above to generate commands</div>';
        } else {
            this.showErrorMessage('No valid audio files selected');
        }
    }        const model = this.elements.whisperModel?.value || 'medium';

    updateWhisperCommands() {
        if (!this.elements.whisperCommands || !this.selectedFiles) return;
        let commands = [];
        if (this.selectedFiles.length === 0) {
            this.elements.whisperCommands.innerHTML = '<div class="text-gray-400 mb-2"># Select files above to generate commands</div>';if (this.selectedFiles.length === 1) {
            return;;
        }

        const model = this.elements.whisperModel?.value || 'medium';format}`;
        const format = this.elements.outputFormat?.value || 'txt';language}`;
        const language = this.elements.whisperLanguage?.value;`);

        let commands = [];ultiple files
         this.selectedFiles.map(f => `"${f.name}"`).join(' ');
        if (this.selectedFiles.length === 1) {
            const file = this.selectedFiles[0];
            let cmd = `whisper "${file.name}"`;format}`;
            cmd += ` --model ${model}`;language}`;
            cmd += ` --output_format ${format}`;md}`);
            if (language) cmd += ` --language ${language}`;
            commands.push(`# Single file processing\n${cmd}`);            // Batch alternative
        } else {lternative: Process all audio files\nwhisper *.mp3 *.wav *.m4a --model ${model} --output_format ${format}${language ? ' --language ' + language : ''}`);
            // Multiple files
            const fileNames = this.selectedFiles.map(f => `"${f.name}"`).join(' ');
            let cmd = `whisper ${fileNames}`;        this.elements.whisperCommands.innerHTML = commands.join('\n\n').replace(/\n/g, '<br>');
            cmd += ` --model ${model}`;
            cmd += ` --output_format ${format}`;
            if (language) cmd += ` --language ${language}`;    copyCommandsToClipboard() {
            commands.push(`# Multiple files processing\n${cmd}`);perCommands) return;

            // Batch alternative        const activateCmd = `cd "/Users/vijayaraghavanvedantham/Documents/VRI Tech Projects/audio-text-converter"\nsource whisper-env/bin/activate\n\n`;
            commands.push(`\n# Alternative: Process all audio files\nwhisper *.mp3 *.wav *.m4a --model ${model} --output_format ${format}${language ? ' --language ' + language : ''}`);
        }
const fullCommands = activateCmd + whisperCmds;
        this.elements.whisperCommands.innerHTML = commands.join('\n\n').replace(/\n/g, '<br>');
    }        navigator.clipboard.writeText(fullCommands).then(() => {
d!');
    copyCommandsToClipboard() {
        if (!this.elements.whisperCommands) return;('Failed to copy commands:', err);

        const activateCmd = `cd "/Users/vijayaraghavanvedantham/Documents/VRI Tech Projects/audio-text-converter"\nsource whisper-env/bin/activate\n\n`;mmands);
        const whisperCmds = this.elements.whisperCommands.textContent.replace(/# Select files above to generate commands/, '');
        
        const fullCommands = activateCmd + whisperCmds;
    handleTranscriptionImport(files) {
        navigator.clipboard.writeText(fullCommands).then(() => { => {
            this.showSuccessMessage('Commands copied to clipboard!');;
        }).catch(err => {
            console.error('Failed to copy commands:', err);rget.result;
            // Fallback: show commands in a popupce(/\.[^/.]+$/, ''); // Remove extension
            prompt('Copy these commands:', fullCommands);
        });// Create project from imported transcription
    }
onst project = projectManager.createProject({
    handleTranscriptionImport(files) {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;                    // Update with transcription content
                const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extensionformatPaliWords(content);
                
                // Create project from imported transcriptionR_REVIEW,
                try {
                    const project = projectManager.createProject({dText,
                        name: `Imported: ${fileName}`,imported)`
                        assignedTo: ''
                    });
                    this.showSuccessMessage(`Imported: ${fileName}`);
                    // Update with transcription content
                    const formattedText = paliProcessor.formatPaliWords(content);rMessage(`Failed to import ${fileName}: ${error.message}`);
                    projectManager.updateProject(project.id, {
                        status: CONFIG.PROJECT_STATUS.READY_FOR_REVIEW,
                        transcription: content,ader.readAsText(file);
                        formattedText: formattedText,
                        audioFileName: `${fileName} (imported)`
                    });        // Clear input
importTranscription.value = '';
                    this.showSuccessMessage(`Imported: ${fileName}`);
                } catch (error) {
                    this.showErrorMessage(`Failed to import ${fileName}: ${error.message}`);    // Toggle transcription method options
                }
            };xist (they may not in the simplified create form)
            reader.readAsText(file);is.elements.apiOptions) {
        });

        // Clear input
        this.elements.importTranscription.value = '';const isLocal = this.elements.methodLocal.checked;
    }
if (isLocal) {
    // Toggle transcription method optionsnts.localWhisperOptions.classList.remove('hidden');
    toggleTranscriptionOptions() {
        // Check if the elements exist (they may not in the simplified create form)
        if (!this.elements.methodLocal || !this.elements.localWhisperOptions || !this.elements.apiOptions) {.elements.localWhisperOptions.classList.add('hidden');
            return;
        }
        
        const isLocal = this.elements.methodLocal.checked;// Re-validate selected audio file if one is selected
        e.files[0]) {
        if (isLocal) {
            this.elements.localWhisperOptions.classList.remove('hidden');
            this.elements.apiOptions.classList.add('hidden');
        } else {
            this.elements.localWhisperOptions.classList.add('hidden');
            this.elements.apiOptions.classList.remove('hidden');    // Generate Local Whisper command for the selected audio file
        }
        
        // Re-validate selected audio file if one is selected
        if (this.elements.audioFile && this.elements.audioFile.files[0]) {const model = this.elements.whisperModel.value;
            const audioFile = this.elements.audioFile.files[0];value;
            this.handleAudioFileSelection(audioFile);
        }
    }let command = `whisper "${audioPath}" --model ${model} --output_format txt`;

    // Generate Local Whisper command for the selected audio fileif (language !== 'auto') {
    generateWhisperCommand(audioFile) {e ${language}`;
        if (!audioFile) return '';
        
        const model = this.elements.whisperModel.value;return command;
        const language = this.elements.whisperLanguage.value;
        const audioPath = audioFile.path || audioFile.name;
            // Start automatic conversion using Local Whisper
        let command = `whisper "${audioPath}" --model ${model} --output_format txt`;, command) {
        xt-btn');
        if (language !== 'auto') {);
            command += ` --language ${language}`;
        }
        -percentage');
        return command;
    }e');

    // Start automatic conversion using Local Whispertatus');
    async startAutomaticConversion(project, audioFile, command) {;
        const convertBtn = document.getElementById('convert-to-text-btn');
        const progressSection = document.getElementById('progress-section');
        const resultsSection = document.getElementById('results-section');// Disable convert button and show progress
        const progressBar = document.getElementById('progress-bar');
        const progressPercentage = document.getElementById('progress-percentage');onverting...';
        const startTimeEl = document.getElementById('start-time'););
        const elapsedTimeEl = document.getElementById('elapsed-time');
        const etaTimeEl = document.getElementById('eta-time');
        const statusEl = document.getElementById('conversion-status');const startTime = new Date();
        const cancelBtn = document.getElementById('cancel-conversion');rtTime.toLocaleTimeString();
        const statsEl = document.getElementById('conversion-stats');
        let currentProgress = 0;
        // Disable convert button and show progress
        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting...';e;
        progressSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');// Estimate processing time based on file size (rough estimate: 1MB per 20-30 seconds)
        00); // minimum 10 seconds
        const startTime = new Date();
        startTimeEl.textContent = startTime.toLocaleTimeString();
        // Update elapsed time every second
        let currentProgress = 0; {
        let progressInterval;
        let elapsedInterval;ow() - startTime.getTime();
        let cancelled = false;
        
        // Estimate processing time based on file size (rough estimate: 1MB per 20-30 seconds)${minutes}:${seconds.toString().padStart(2, '0')}`;
        const estimatedDurationMs = Math.max((audioFile.size / (1024 * 1024)) * 25 * 1000, 10000); // minimum 10 seconds
        const progressIncrement = 100 / (estimatedDurationMs / 1000); // progress per second
        // Simulate progress updates
        // Update elapsed time every secondal(() => {
        elapsedInterval = setInterval(() => {
            if (cancelled) return;
            const elapsed = Date.now() - startTime.getTime();currentProgress += progressIncrement;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = elapsed % 60;if (currentProgress <= 25) {
            elapsedTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;Loading Whisper model...';
        }, 1000);
        ing audio file...';
        // Simulate progress updates
        progressInterval = setInterval(() => {ibing speech...';
            if (cancelled) return;
            ing transcription...';
            currentProgress += progressIncrement;
            usEl.textContent = 'Almost complete...';
            if (currentProgress <= 25) {
                statusEl.textContent = 'Loading Whisper model...';
            } else if (currentProgress <= 50) {const displayProgress = Math.min(currentProgress, 99);
                statusEl.textContent = 'Processing audio file...';
            } else if (currentProgress <= 75) {layProgress) + '%';
                statusEl.textContent = 'Transcribing speech...';
            } else if (currentProgress <= 95) {// Calculate ETA
                statusEl.textContent = 'Finalizing transcription...';Date.now() - startTime.getTime();
            } else {
                statusEl.textContent = 'Almost complete...'; (elapsed / currentProgress) * 100;
            }
            
            const displayProgress = Math.min(currentProgress, 99);if (remaining > 0) {
            progressBar.style.width = displayProgress + '%'; = Math.floor(remaining / 60000);
            progressPercentage.textContent = Math.floor(displayProgress) + '%'; / 1000);
            ng().padStart(2, '0')}`;
            // Calculate ETA
            const elapsed = Date.now() - startTime.getTime();imeEl.textContent = 'Almost done...';
            if (currentProgress > 5) {
                const estimatedTotal = (elapsed / currentProgress) * 100;
                const remaining = estimatedTotal - elapsed;00);
                
                if (remaining > 0) {// Cancel button functionality
                    const etaMinutes = Math.floor(remaining / 60000);ick', () => {
                    const etaSeconds = Math.floor((remaining % 60000) / 1000);
                    etaTimeEl.textContent = `${etaMinutes}:${etaSeconds.toString().padStart(2, '0')}`;gressInterval);
                } else {
                    etaTimeEl.textContent = 'Almost done...';
                }// Reset UI
            }disabled = false;
        }, 1000); Convert to Text';
        
        // Cancel button functionalitylled';
        cancelBtn.addEventListener('click', () => {
            cancelled = true;
            clearInterval(progressInterval);try {
            clearInterval(elapsedInterval);/ Execute the Whisper command using a simulated backend call
            at runs the Whisper command
            // Reset UI
            convertBtn.disabled = false;
            convertBtn.textContent = '🎵 Convert to Text';if (cancelled) return;
            progressSection.classList.add('hidden');
            statusEl.textContent = 'Conversion cancelled';// Complete the progress
        }, { once: true });terval);
        
        try {
            // Execute the Whisper command using a simulated backend callprogressBar.style.width = '100%';
            // In a real implementation, this would call a backend API that runs the Whisper command'100%';
            const result = await this.executeWhisperCommand(command, audioFile.name);ete!';
            
            if (cancelled) return;
            const totalTime = Date.now() - startTime.getTime();
            // Complete the progress
            clearInterval(progressInterval); / 1000);
            clearInterval(elapsedInterval);ime / 1000 / 60)).toFixed(2);
            
            progressBar.style.width = '100%';// Show results
            progressPercentage.textContent = '100%';ML = `
            statusEl.textContent = 'Conversion complete!';g Complete!</strong><br>
            etaTimeEl.textContent = 'Done!';().padStart(2, '0')}<br>
            
            const totalTime = Date.now() - startTime.getTime();
            const minutes = Math.floor(totalTime / 60000);lt.wordCount || 'Unknown'}
            const seconds = Math.floor((totalTime % 60000) / 1000);
            const speed = (audioFile.size / (1024 * 1024) / (totalTime / 1000 / 60)).toFixed(2);
            // Update project with transcription
            // Show results.id, {
            statsEl.innerHTML = `
                <strong>Processing Complete!</strong><br>().toISOString(),
                Total time: ${minutes}:${seconds.toString().padStart(2, '0')}<br>
                File size: ${UTILS.formatFileSize(audioFile.size)}<br>
                Speed: ${speed} MB/min<br>
                Words transcribed: ~${result.wordCount || 'Unknown'}progressSection.classList.add('hidden');
            `;);
            
            // Update project with transcription// Reset convert button
            projectManager.updateProject(project.id, {alse;
                transcription: result.text,Converted';
                transcriptionDate: new Date().toISOString(),0', 'hover:bg-blue-700');
                status: 'completed'
            });
            tch (error) {
            progressSection.classList.add('hidden');) return;
            resultsSection.classList.remove('hidden');
            clearInterval(progressInterval);
            // Reset convert button
            convertBtn.disabled = false;
            convertBtn.textContent = '✅ Converted';this.showErrorMessage('Conversion failed: ' + error.message);
            convertBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            convertBtn.classList.add('bg-green-600', 'hover:bg-green-700');// Reset UI
            disabled = false;
        } catch (error) { Convert to Text';
            if (cancelled) return;
            
            clearInterval(progressInterval);
            clearInterval(elapsedInterval);
                // Execute Whisper command using the backend service
            this.showErrorMessage('Conversion failed: ' + error.message);{
            
            // Reset UI/ For web browsers, we need to simulate this since we can't directly execute shell commands
            convertBtn.disabled = false;
            convertBtn.textContent = '🎵 Convert to Text';
            progressSection.classList.add('hidden');// For now, let's check if there's already a transcription file from previous runs
        }
    }
try {
    // Execute Whisper command using the backend serviceonst response = await fetch(expectedTextFile);
    async executeWhisperCommand(command, audioFileName) {
        try {wait response.text();
            // For web browsers, we need to simulate this since we can't directly execute shell commands
            // In a real production environment, this would call a backend APIess: true,
            
            // For now, let's check if there's already a transcription file from previous runstext.split(/\s+/).filter(word => word.length > 0).length,
            const expectedTextFile = audioFileName.replace(/\.[^/.]+$/, "") + ".txt";
            
            try {
                const response = await fetch(expectedTextFile);ch (e) {
                if (response.ok) {oesn't exist or can't be read
                    const text = await response.text();
                    return {
                        success: true,// Show message about backend execution
                        text: text,d('conversion-status');
                        wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
                        fromExistingFile: truenerHTML = `
                    };e-50 border border-blue-200 rounded p-3 mt-2">
                }
            } catch (e) {strong> In a production environment, this would execute:<br>
                // File doesn't exist or can't be read
            }
            
            // Show message about backend execution
            const statusEl = document.getElementById('conversion-status');
            if (statusEl) {
                statusEl.innerHTML = `// Simulate processing for demo purposes
                    <div class="bg-blue-50 border border-blue-200 rounded p-3 mt-2">resolve, 3000));
                        <p class="text-blue-800 text-sm">
                            <strong>Backend Processing:</strong> In a production environment, this would execute:<br>// Return success with demo transcription
                            <code class="text-xs">${command}</code>
                        </p>ess: true,
                    </div>anscription for ${audioFileName}. In production, this would contain the actual Whisper output from your audio file.`,
                `;
            }
            
            // Simulate processing for demo purposes
            await new Promise(resolve => setTimeout(resolve, 3000));tch (error) {
            or(`Conversion failed: ${error.message}`);
            // Return success with demo transcription
            return {
                success: true,
                text: `Demo transcription for ${audioFileName}. In production, this would contain the actual Whisper output from your audio file.`,    // Check if Whisper backend is available
                wordCount: 250,
                simulated: true
            };onst healthUrl = CONFIG.WHISPER_BACKEND.URL.replace('/process', '/health');
            
        } catch (error) {
            throw new Error(`Conversion failed: ${error.message}`);ignal.timeout(5000) // 5 second timeout
        }
    }urn response.ok;

    // Check if Whisper backend is available'Backend health check failed:', error);
    async checkWhisperBackendAvailable() {
        try {
            const healthUrl = CONFIG.WHISPER_BACKEND.URL.replace('/process', '/health');
            const response = await fetch(healthUrl, {
                method: 'GET',    // Check and update backend status UI
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });ndicator || !this.elements.backendStatusText) {
            return response.ok;
        } catch (error) {
            console.warn('Backend health check failed:', error);
            return false;        // Update UI to show checking state
        }r.className = 'w-3 h-3 rounded-full bg-yellow-400 animate-pulse';
    }

    // Check and update backend status UIif (this.elements.btnTestBackend) {
    async checkAndUpdateBackendStatus() {sabled = true;
        if (!this.elements.backendStatusIndicator || !this.elements.backendStatusText) {esting...';
            return;
        }
        try {
        // Update UI to show checking stateonst isAvailable = await this.checkWhisperBackendAvailable();
        this.elements.backendStatusIndicator.className = 'w-3 h-3 rounded-full bg-yellow-400 animate-pulse';
        this.elements.backendStatusText.textContent = 'Checking backend status...';if (isAvailable) {
        available
        if (this.elements.btnTestBackend) {atusIndicator.className = 'w-3 h-3 rounded-full bg-green-500';
            this.elements.btnTestBackend.disabled = true;
            this.elements.btnTestBackend.textContent = 'Testing...';
        }if (this.elements.backendInstructions) {
assList.add('hidden');
        try {
            const isAvailable = await this.checkWhisperBackendAvailable();e {
            ackend is not available
            if (isAvailable) {Indicator.className = 'w-3 h-3 rounded-full bg-red-500';
                // Backend is availablee demo mode)';
                this.elements.backendStatusIndicator.className = 'w-3 h-3 rounded-full bg-green-500';
                this.elements.backendStatusText.textContent = 'Whisper backend is running ✅';if (this.elements.backendInstructions) {
                assList.remove('hidden');
                if (this.elements.backendInstructions) {
                    this.elements.backendInstructions.classList.add('hidden');
                }ch (error) {
            } else {king backend
                // Backend is not availableusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
                this.elements.backendStatusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';demo mode)';
                this.elements.backendStatusText.textContent = 'Whisper backend not running (will use demo mode)';
                if (this.elements.backendInstructions) {
                if (this.elements.backendInstructions) {assList.remove('hidden');
                    this.elements.backendInstructions.classList.remove('hidden');
                }ally {
            }t button state
        } catch (error) {TestBackend) {
            // Error checking backendsabled = false;
            this.elements.backendStatusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';st Connection';
            this.elements.backendStatusText.textContent = 'Cannot connect to backend (will use demo mode)';
            
            if (this.elements.backendInstructions) {
                this.elements.backendInstructions.classList.remove('hidden');
            }    // Auto-start Whisper backend
        } finally {() {
            // Reset button state
            if (this.elements.btnTestBackend) {onsole.log('🔄 Checking if Whisper backend is available...');
                this.elements.btnTestBackend.disabled = false;
                this.elements.btnTestBackend.textContent = 'Test Connection';// Check if backend is already running
            }perBackendAvailable();
        }
    }'✅ Whisper backend already running');

    // Auto-start Whisper backendackend connected - real audio processing available!', 3000);
    async autoStartWhisperBackend() {
        try {
            console.log('🔄 Checking if Whisper backend is available...');
                        console.log('⚡ Attempting to auto-start Whisper backend...');
            // Check if backend is already running
            const isRunning = await this.checkWhisperBackendAvailable();
            if (isRunning) {// Try to start the backend automatically
                console.log('✅ Whisper backend already running');isperBackend();
                this.updateBackendStatusUI(true);
                this.showInfoMessage('✅ Whisper backend connected - real audio processing available!', 3000);if (startResult.success) {
                return; backend started successfully');
            }
r backend started - real audio processing available!');
            console.log('⚡ Attempting to auto-start Whisper backend...');
            this.showInfoMessage('🚀 Starting Whisper backend...', 2000);ole.log('ℹ️ Could not auto-start backend, using demo mode');
            
            // Try to start the backend automatically
            const startResult = await this.tryStartWhisperBackend();// Show helpful message about manual start
            
            if (startResult.success) {essage('💡 Auto-start failed. You can start manually or use demo mode for testing', 5000);
                console.log('✅ Whisper backend started successfully');
                this.updateBackendStatusUI(true);
                this.showSuccessMessage('✅ Whisper backend started - real audio processing available!');
            } else {        } catch (error) {
                console.log('ℹ️ Could not auto-start backend, using demo mode');'Failed to auto-start Whisper backend:', error);
                this.updateBackendStatusUI(false);
                uto-start unavailable - using demo mode', 3000);
                // Show helpful message about manual start
                setTimeout(() => {
                    this.showInfoMessage('💡 Auto-start failed. You can start manually or use demo mode for testing', 5000);
                }, 1000);    // Try to start the Whisper backend automatically
            }

        } catch (error) {/ Since web browsers can't execute shell scripts directly,
            console.warn('Failed to auto-start Whisper backend:', error);etect when it's available
            this.updateBackendStatusUI(false);
            this.showInfoMessage('💡 Backend auto-start unavailable - using demo mode', 3000);console.log('🔄 Guiding user to start backend manually...');
        }
    }// Show instructions to the user
ons();
    // Try to start the Whisper backend automatically
    async tryStartWhisperBackend() {// Poll for backend availability for up to 30 seconds
        try {ntervals
            // Since web browsers can't execute shell scripts directly,
            // we'll guide the user to start the backend manually and detect when it's available
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log('🔄 Guiding user to start backend manually...');empts})...`);
            
            // Show instructions to the user// Wait between attempts
            this.showBackendStartupInstructions();e => setTimeout(resolve, attemptDelay));
            
            // Poll for backend availability for up to 30 seconds// Check if backend is now available
            const maxAttempts = 15; // 30 seconds with 2-second intervalsWhisperBackendAvailable();
            const attemptDelay = 2000; // 2 seconds between attempts
            p instructions
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {uctions();
                console.log(`Checking for backend (${attempt}/${maxAttempts})...`);end is now available' };
                
                // Wait between attempts
                await new Promise(resolve => setTimeout(resolve, attemptDelay));// Update progress in instructions
                attempt, maxAttempts);
                // Check if backend is now available
                const isAvailable = await this.checkWhisperBackendAvailable();
                if (isAvailable) {// If we get here, backend didn't start within timeout
                    // Hide startup instructions
                    this.hideBackendStartupInstructions();Backend did not become available within timeout' };
                    return { success: true, message: 'Backend is now available' };
                }tch (error) {
                ('Error in tryStartWhisperBackend:', error);
                // Update progress in instructions
                this.updateBackendStartupProgress(attempt, maxAttempts);
            }
            
            // If we get here, backend didn't start within timeout    // Show backend startup instructions
            this.updateBackendStartupTimeout();
            return { success: false, message: 'Backend did not become available within timeout' };ion with startup instructions
            
        } catch (error) {up-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            console.error('Error in tryStartWhisperBackend:', error);
            return { success: false, message: error.message };tarting Whisper Backend</h3>
        }
    }<div class="space-y-4">
ext-gray-600">
    // Show backend startup instructionsed manually. Please follow these steps:
    showBackendStartupInstructions() {
        // Create a modal or notification with startup instructions
        const instructionsHTML = `<div class="bg-gray-100 rounded p-3 text-sm font-mono">
            <div id="backend-startup-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">uments/VRI Tech Projects/audio-text-converter"</div>
                <div class="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">🚀 Starting Whisper Backend</h3>
                    
                    <div class="space-y-4"><div id="startup-progress" class="text-sm text-gray-600">
                        <p class="text-sm text-gray-600">
                            The backend needs to be started manually. Please follow these steps: h-4 w-4 border-b-2 border-blue-600"></div>
                        </p>
                        
                        <div class="bg-gray-100 rounded p-3 text-sm font-mono">
                            <div>2. Run: cd "/Users/vijayaraghavanvedantham/Documents/VRI Tech Projects/audio-text-converter"</div>
                            <div>3. Run: ./auto-whisper.sh start</div><div class="flex space-x-3">
                        </div>rtup-commands" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
                        
                        <div id="startup-progress" class="text-sm text-gray-600">
                            <div class="flex items-center space-x-2">d="btn-use-demo-mode" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">
                                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span>Waiting for backend to start... (0/15)</span>
                            </div>
                        </div>
                        
                        <div class="flex space-x-3">
                            <button id="btn-copy-startup-commands" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
                                Copy Commands
                            </button>// Remove any existing modal
                            <button id="btn-use-demo-mode" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">nt.getElementById('backend-startup-modal');
                                Use Demo Mode
                            </button>move();
                        </div>
                    </div>
                </div>// Add the modal to the page
            </div>HTML('beforeend', instructionsHTML);
        `;
        // Bind events
        // Remove any existing modal= document.getElementById('btn-copy-startup-commands');
        const existingModal = document.getElementById('backend-startup-modal');
        if (existingModal) {
            existingModal.remove();if (copyBtn) {
        }dEventListener('click', () => {
        ghavanvedantham/Documents/VRI Tech Projects/audio-text-converter"\n./auto-whisper.sh start`;
        // Add the modal to the page
        document.body.insertAdjacentHTML('beforeend', instructionsHTML);
        
        // Bind eventsntent = 'Copy Commands';
        const copyBtn = document.getElementById('btn-copy-startup-commands');
        const demoBtn = document.getElementById('btn-use-demo-mode');
        
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const commands = `cd "/Users/vijayaraghavanvedantham/Documents/VRI Tech Projects/audio-text-converter"\n./auto-whisper.sh start`;if (demoBtn) {
                navigator.clipboard.writeText(commands).then(() => {dEventListener('click', () => {
                    copyBtn.textContent = 'Copied!';;
                    setTimeout(() => {
                        copyBtn.textContent = 'Copy Commands';o mode - no real audio processing', 3000);
                    }, 2000);
                });
            });
        }
            // Update backend startup progress
        if (demoBtn) {pt, maxAttempts) {
            demoBtn.addEventListener('click', () => {tup-progress');
                this.hideBackendStartupInstructions();
                this.updateBackendStatusUI(false);sText = progressEl.querySelector('span');
                this.showInfoMessage('💡 Using demo mode - no real audio processing', 3000);
            });xtContent = `Waiting for backend to start... (${attempt}/${maxAttempts})`;
        }
    }

    // Update backend startup progress
    updateBackendStartupProgress(attempt, maxAttempts) {    // Update when backend startup times out
        const progressEl = document.getElementById('startup-progress');
        if (progressEl) {.getElementById('startup-progress');
            const progressText = progressEl.querySelector('span');
            if (progressText) {nerHTML = `
                progressText.textContent = `Waiting for backend to start... (${attempt}/${maxAttempts})`;low-600">
            }n continue trying or use demo mode.
        }
    }

    // Update when backend startup times out
    updateBackendStartupTimeout() {
        const progressEl = document.getElementById('startup-progress');    // Hide backend startup instructions
        if (progressEl) {
            progressEl.innerHTML = `entById('backend-startup-modal');
                <div class="text-yellow-600">
                    ⏰ Timeout reached. You can continue trying or use demo mode.move();
                </div>
            `;
        }
    }    // Update backend status UI
ning) {
    // Hide backend startup instructionsusIndicator || !this.elements.backendStatusText) {
    hideBackendStartupInstructions() {
        const modal = document.getElementById('backend-startup-modal');
        if (modal) {
            modal.remove();        if (isRunning) {
        }s.backendStatusIndicator.className = 'w-3 h-3 rounded-full bg-green-500';
    }

    // Update backend status UIif (this.elements.backendInstructions) {
    updateBackendStatusUI(isRunning) {assList.add('hidden');
        if (!this.elements.backendStatusIndicator || !this.elements.backendStatusText) {
            return;e {
        }.elements.backendStatusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
emo mode)';
        if (isRunning) {
            this.elements.backendStatusIndicator.className = 'w-3 h-3 rounded-full bg-green-500';if (this.elements.backendInstructions) {
            this.elements.backendStatusText.textContent = 'Whisper backend is running ✅';assList.remove('hidden');
            
            if (this.elements.backendInstructions) {
                this.elements.backendInstructions.classList.add('hidden');
            }
        } else {    // Handle text generation from audio
            this.elements.backendStatusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';{
            this.elements.backendStatusText.textContent = 'Whisper backend not running (using demo mode)';
            onst project = projectManager.getProject(projectId);
            if (this.elements.backendInstructions) {
                this.elements.backendInstructions.classList.remove('hidden');rorMessage('Project not found');
            }
        }
    }
            if (!project.audioFile) {
    // Handle text generation from audio('No audio file attached to this project');
    async handleGenerateText(projectId) {
        try {
            const project = projectManager.getProject(projectId);
            if (!project) {            // Update project status to processing
                this.showErrorMessage('Project not found');, {
                return;ING
            }

            if (!project.audioFile) {            // Refresh view to show progress bar
                this.showErrorMessage('No audio file attached to this project');
                return;
            }            // Start the conversion process

            // Update project status to processing
            projectManager.updateProject(projectId, {s(0, 'Initializing Whisper...');
                status: CONFIG.PROJECT_STATUS.PROCESSING
            });            // Process with local whisper
cessWithLocalWhisper(project);
            // Refresh view to show progress bar
            this.showProjectReview(projectId);            if (result.success) {

            // Start the conversion processonTimer();
            const startTime = Date.now();
            this.startConversionTimer();// Update project with results - ready for review
            this.updateConversionProgress(0, 'Initializing Whisper...');
EVIEW,
            // Process with local whisper
            const result = await this.processWithLocalWhisper(project);  // Store timestamps

            if (result.success) {,
                // Stop the timer
                this.stopConversionTimer();
                
                // Update project with results - ready for review                const duration = Math.round((Date.now() - startTime) / 1000);
                projectManager.updateProject(projectId, {ion} seconds! Ready for review.`);
                    status: CONFIG.PROJECT_STATUS.NEEDS_REVIEW,
                    transcription: result.transcription,
                    timestamps: result.timestamps || [],  // Store timestampsse {
                    formattedText: result.transcription,top the timer
                    generatedTextPath: result.outputPath,onTimer();
                    error: null
                });// Update project with error
(projectId, {
                const duration = Math.round((Date.now() - startTime) / 1000);
                this.showSuccessMessage(`Text generation completed in ${duration} seconds! Ready for review.`);
                this.showProjectReview(projectId);
                
            } else {this.showErrorMessage(result.error);
                // Stop the timer
                this.stopConversionTimer();
                
                // Update project with error        } catch (error) {
                projectManager.updateProject(projectId, {imer
                    status: CONFIG.PROJECT_STATUS.ERROR,onTimer();
                    error: result.error
                });projectManager.updateProject(projectId, {
                
                this.showErrorMessage(result.error);
                this.showProjectReview(projectId);
            }
this.showErrorMessage(error.message);
        } catch (error) {
            // Stop the timer
            this.stopConversionTimer();
            
            projectManager.updateProject(projectId, {    // Check if Whisper backend is available
                status: CONFIG.PROJECT_STATUS.ERROR,
                error: error.message
            });onst healthUrl = CONFIG.WHISPER_BACKEND.URL.replace('/process', '/health');
            
            this.showErrorMessage(error.message);
            this.showProjectReview(projectId);ignal.timeout(5000) // 5 second timeout
        }
    }urn response.ok;

    // Check if Whisper backend is available'Backend health check failed:', error);
    async checkWhisperBackendAvailable() {
        try {
            const healthUrl = CONFIG.WHISPER_BACKEND.URL.replace('/process', '/health');
            const response = await fetch(healthUrl, {
                method: 'GET',    // Process audio using local Whisper backend
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            return response.ok;onsole.log('🎵 Processing with Local Whisper');
        } catch (error) {previewMode);
            console.warn('Backend health check failed:', error);
            return false;// Update progress
        }ionProgress(10, 'Preparing audio file...');
    }
            // Create FormData for the backend
    // Process audio using local Whisper backend
    async processWithLocalWhisper(project) {.audioFile);
        try {lt model
            console.log('🎵 Processing with Local Whisper');anguage
            console.log('🔍 Project preview mode:', project.previewMode);
            // Add preview mode if enabled
            // Update progress
            this.updateConversionProgress(10, 'Preparing audio file...');ew', 'true');
 '60');
            // Create FormData for the backendding preview parameters to backend');
            const formData = new FormData();
            formData.append('audio', project.audioFile);ole.log('🔍 Preview mode disabled - processing full audio');
            formData.append('model', 'medium'); // Default model
            formData.append('language', 'English'); // Default language
                        // Make the request to the backend with timeout
            // Add preview mode if enabled
            if (project.previewMode) {ller.abort(), 30 * 60 * 1000); // 30 minutes timeout
                formData.append('preview', 'true');
                formData.append('preview_duration', '60');try {
                console.log('🔍 Preview mode enabled - sending preview parameters to backend');onst response = await fetch('http://localhost:8000/process', {
            } else {
                console.log('🔍 Preview mode disabled - processing full audio');
            }ler.signal

            // Make the request to the backend with timeout
            const controller = new AbortController();                clearTimeout(timeoutId);
            const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000); // 30 minutes timeout
                            if (!response.ok) {
            try {(`HTTP error! status: ${response.status}`);
                const response = await fetch('http://localhost:8000/process', {
                    method: 'POST',
                    body: formData,                const result = await response.json();
                    signal: controller.signal
                });if (result.success) {

                clearTimeout(timeoutId);ess: true,
 result.transcription,
                if (!response.ok) {  // Include timestamps
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
sing_time_seconds
                const result = await response.json();
                 {
                if (result.success) {w new Error(result.error || 'Transcription failed');
                    return {
                        success: true,ch (fetchError) {
                        transcription: result.transcription,utId);
                        timestamps: result.timestamps || [],  // Include timestamps
                        outputPath: result.output_path,if (fetchError.name === 'AbortError') {
                        wordCount: result.word_count,after 30 minutes. Please try with a smaller audio file or enable preview mode.');
                        processingTime: result.processing_time_seconds
                    };se ensure the backend is running by clicking "Start Backend" in the Local Whisper tab.');
                } else {
                    throw new Error(result.error || 'Transcription failed');w fetchError;
                }
            } catch (fetchError) {
                clearTimeout(timeoutId);
                        } catch (error) {
                if (fetchError.name === 'AbortError') {
                    throw new Error('Request timed out after 30 minutes. Please try with a smaller audio file or enable preview mode.');ess: false,
                } else if (fetchError.message.includes('Failed to fetch')) {ssage
                    throw new Error('Cannot connect to Whisper backend. Please ensure the backend is running by clicking "Start Backend" in the Local Whisper tab.');
                } else {
                    throw fetchError;
                }
            }    // Update conversion progress
entage, message) {
        } catch (error) {('conversion-progress-bar');
            return {);
                success: false,
                error: error.messageif (progressBar) {
            };yle.width = `${percentage}%`;
        }
    }
if (progressText) {
    // Update conversion progressxtContent = message;
    updateConversionProgress(percentage, message) {
        const progressBar = document.getElementById('conversion-progress-bar');
        const progressText = document.getElementById('conversion-progress-text');
            // Download generated text file
        if (progressBar) { filename) {
            progressBar.style.width = `${percentage}%`;
        }onst content = project.transcription || 'No transcription available';
        
        if (progressText) {
            progressText.textContent = message;
        }const a = document.createElement('a');
    }
filename;
    // Download generated text fileild(a);
    async downloadTextFile(project, filename) {
        try {ody.removeChild(a);
            const content = project.transcription || 'No transcription available';
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);this.showSuccessMessage(`Downloaded: ${filename}`);
            
            const a = document.createElement('a');tch (error) {
            a.href = url;rMessage(error.message);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);    // Handle start backend request
            URL.revokeObjectURL(url);() {
            
            this.showSuccessMessage(`Downloaded: ${filename}`);onsole.log('🔄 Manual backend start requested...');
            
        } catch (error) {// Show the startup instructions modal
            this.showErrorMessage(error.message);
        }
    }// Start monitoring for backend availability
kend();
    // Handle start backend request
    async handleStartBackendRequest() {if (result.success) {
        try {essage('✅ Whisper backend started successfully!');
            console.log('🔄 Manual backend start requested...');
            
            // Show the startup instructions modalole.log('Backend start attempt completed without success');
            this.showBackendStartupInstructions();
            
            // Start monitoring for backend availabilitytch (error) {
            const result = await this.tryStartWhisperBackend();('Error handling start backend request:', error);
            age);
            if (result.success) {
                this.showSuccessMessage('✅ Whisper backend started successfully!');
                this.checkAndUpdateBackendStatus(); // Update UI
            } else {}
                console.log('Backend start attempt completed without success');
            }// Initialize global UI controller instance
            
        } catch (error) {Listener('DOMContentLoaded', () => {
            console.error('Error handling start backend request:', error);
            this.showErrorMessage('Failed to start backend: ' + error.message);        }
    }

}

// Initialize global UI controller instance
let uiController;
document.addEventListener('DOMContentLoaded', () => {
    uiController = new UIController();
});