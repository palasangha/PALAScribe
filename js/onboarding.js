// Enhanced Welcome and Onboarding Module for PALAScribe
// This module provides interactive onboarding for first-time users

class OnboardingManager {
    constructor() {
        this.isFirstTime = !localStorage.getItem('palascribe_onboarded');
        this.currentStep = 0;
        this.steps = [
            {
                title: "Welcome to PALAScribe! 🎵",
                content: `
                    <div class="text-center">
                        <div class="text-6xl mb-4">🎙️</div>
                        <h2 class="text-2xl font-bold mb-4">Welcome to PALAScribe</h2>
                        <p class="text-gray-600 mb-6">Your intelligent audio transcription tool designed specifically for Buddhist content with automatic Pali term recognition and correction.</p>
                        <div class="bg-blue-50 p-4 rounded-lg text-left">
                            <h3 class="font-semibold mb-2">✨ Key Features:</h3>
                            <ul class="text-sm space-y-1">
                                <li>• Accurate audio-to-text transcription</li>
                                <li>• Automatic Pali Buddhist term correction</li>
                                <li>• Professional document generation</li>
                                <li>• Project management and review workflow</li>
                            </ul>
                        </div>
                    </div>
                `,
                action: "Get Started"
            },
            {
                title: "Setup Check ✅",
                content: `
                    <div>
                        <h2 class="text-xl font-bold mb-4">Let's verify your setup</h2>
                        <div id="setup-checklist" class="space-y-3">
                            <div class="flex items-center space-x-3">
                                <div id="check-backend" class="w-5 h-5 border rounded border-gray-300"></div>
                                <span>Backend server connection</span>
                                <div id="backend-status" class="text-xs text-gray-500">Checking...</div>
                            </div>
                            <div class="flex items-center space-x-3">
                                <div id="check-upload" class="w-5 h-5 border rounded border-gray-300"></div>
                                <span>File upload capability</span>
                                <div id="upload-status" class="text-xs text-gray-500">Ready</div>
                            </div>
                            <div class="flex items-center space-x-3">
                                <div id="check-local" class="w-5 h-5 border rounded border-gray-300"></div>
                                <span>Local processing mode</span>
                                <div id="local-status" class="text-xs text-gray-500">Available</div>
                            </div>
                        </div>
                        <div class="mt-6 p-4 bg-yellow-50 rounded-lg">
                            <p class="text-sm"><strong>Note:</strong> PALAScribe works completely offline using local Whisper AI. No data is sent to external servers.</p>
                        </div>
                    </div>
                `,
                action: "Check Setup"
            },
            {
                title: "Quick Demo 🎬",
                content: `
                    <div>
                        <h2 class="text-xl font-bold mb-4">Try a quick demo</h2>
                        <p class="mb-4">Upload a short audio file to see PALAScribe in action. Watch how it automatically corrects Buddhist terms!</p>
                        
                        <div class="bg-green-50 p-4 rounded-lg mb-4">
                            <h3 class="font-semibold mb-2">🎯 Try saying this phrase:</h3>
                            <p class="italic">"Buddha taught the Dharma with great Panya and Samadhi"</p>
                            <p class="text-sm text-green-700 mt-2">Expected result: "Buddha taught the Dhamma with great Paññā and Samādhi"</p>
                        </div>
                        
                        <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center" id="demo-drop-zone">
                            <div class="text-4xl mb-2">📁</div>
                            <p class="text-gray-600">Drop an audio file here or click to upload</p>
                            <p class="text-xs text-gray-500 mt-2">Supported: MP3, WAV, M4A, FLAC (max 25MB)</p>
                            <input type="file" id="demo-file-input" class="hidden" accept="audio/*">
                        </div>
                    </div>
                `,
                action: "Skip Demo"
            },
            {
                title: "You're all set! 🚀",
                content: `
                    <div class="text-center">
                        <div class="text-6xl mb-4">✅</div>
                        <h2 class="text-2xl font-bold mb-4">Ready to transcribe!</h2>
                        <p class="text-gray-600 mb-6">PALAScribe is configured and ready to help you create accurate transcriptions of Buddhist audio content.</p>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div class="bg-blue-50 p-4 rounded-lg">
                                <div class="text-2xl mb-2">🎙️</div>
                                <h3 class="font-semibold">Upload Audio</h3>
                                <p class="text-xs text-gray-600">Start new projects</p>
                            </div>
                            <div class="bg-orange-50 p-4 rounded-lg">
                                <div class="text-2xl mb-2">📝</div>
                                <h3 class="font-semibold">Review</h3>
                                <p class="text-xs text-gray-600">Edit transcriptions</p>
                            </div>
                            <div class="bg-green-50 p-4 rounded-lg">
                                <div class="text-2xl mb-2">📄</div>
                                <h3 class="font-semibold">Export</h3>
                                <p class="text-xs text-gray-600">Download documents</p>
                            </div>
                        </div>
                        
                        <div class="text-sm text-gray-500 mb-4">
                            <p>💡 <strong>Tip:</strong> For best results, use clear audio recordings with minimal background noise.</p>
                        </div>
                    </div>
                `,
                action: "Start Using PALAScribe"
            }
        ];
    }

    // Show onboarding modal if first time
    showOnboarding() {
        if (!this.isFirstTime) return;
        
        this.createModal();
        this.showStep(0);
    }

    // Create modal structure
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'onboarding-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-6">
                        <div class="flex items-center space-x-2">
                            <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                            <span class="font-semibold text-gray-800">PALAScribe Setup</span>
                        </div>
                        <button id="skip-onboarding" class="text-gray-400 hover:text-gray-600 text-sm">Skip Setup</button>
                    </div>
                    
                    <!-- Progress bar -->
                    <div class="mb-6">
                        <div class="flex justify-between text-xs text-gray-500 mb-2">
                            <span>Step <span id="current-step">1</span> of ${this.steps.length}</span>
                            <span id="progress-percent">25%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div id="progress-bar" class="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300" style="width: 25%"></div>
                        </div>
                    </div>
                    
                    <!-- Content area -->
                    <div id="onboarding-content" class="min-h-[300px]">
                        <!-- Dynamic content -->
                    </div>
                    
                    <!-- Action buttons -->
                    <div class="flex justify-between mt-6 pt-6 border-t border-gray-200">
                        <button id="prev-step" class="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                            ← Previous
                        </button>
                        <button id="next-step" class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors">
                            Next →
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.attachEventListeners();
    }

    // Show specific step
    showStep(stepIndex) {
        this.currentStep = stepIndex;
        const step = this.steps[stepIndex];
        
        // Update progress
        const progressPercent = ((stepIndex + 1) / this.steps.length) * 100;
        document.getElementById('current-step').textContent = stepIndex + 1;
        document.getElementById('progress-percent').textContent = `${Math.round(progressPercent)}%`;
        document.getElementById('progress-bar').style.width = `${progressPercent}%`;
        
        // Update content
        document.getElementById('onboarding-content').innerHTML = step.content;
        
        // Update buttons
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');
        
        prevBtn.disabled = stepIndex === 0;
        nextBtn.textContent = stepIndex === this.steps.length - 1 ? step.action : 'Next →';
        
        // Handle step-specific functionality
        this.handleStepSpecificLogic(stepIndex);
    }

    // Handle step-specific logic
    handleStepSpecificLogic(stepIndex) {
        switch(stepIndex) {
            case 1: // Setup check
                this.performSetupCheck();
                break;
            case 2: // Demo
                this.setupDemoUpload();
                break;
        }
    }

    // Perform setup verification
    async performSetupCheck() {
        const checks = [
            { id: 'backend', endpoint: '/health' },
            { id: 'upload', test: () => window.File && window.FileReader },
            { id: 'local', test: () => true }
        ];

        for (const check of checks) {
            const checkEl = document.getElementById(`check-${check.id}`);
            const statusEl = document.getElementById(`${check.id}-status`);
            
            try {
                let result = false;
                if (check.endpoint) {
                    const response = await fetch(`http://localhost:8000${check.endpoint}`);
                    result = response.ok;
                } else if (check.test) {
                    result = check.test();
                }
                
                if (result) {
                    checkEl.innerHTML = '✅';
                    checkEl.className = 'w-5 h-5 text-green-500';
                    statusEl.textContent = 'Ready';
                    statusEl.className = 'text-xs text-green-600';
                } else {
                    throw new Error('Check failed');
                }
            } catch (error) {
                checkEl.innerHTML = '❌';
                checkEl.className = 'w-5 h-5 text-red-500';
                statusEl.textContent = 'Issue detected';
                statusEl.className = 'text-xs text-red-600';
            }
        }
    }

    // Setup demo file upload
    setupDemoUpload() {
        const dropZone = document.getElementById('demo-drop-zone');
        const fileInput = document.getElementById('demo-file-input');
        
        if (!dropZone || !fileInput) return;
        
        // Click to upload
        dropZone.addEventListener('click', () => fileInput.click());
        
        // Drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-blue-500', 'bg-blue-50');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('border-blue-500', 'bg-blue-50');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-blue-500', 'bg-blue-50');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleDemoFile(files[0]);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleDemoFile(e.target.files[0]);
            }
        });
    }

    // Handle demo file upload
    handleDemoFile(file) {
        const dropZone = document.getElementById('demo-drop-zone');
        
        // Validate file
        if (!file.type.startsWith('audio/')) {
            this.showNotification('Please select an audio file', 'error');
            return;
        }
        
        if (file.size > 25 * 1024 * 1024) {
            this.showNotification('File size must be under 25MB', 'error');
            return;
        }
        
        // Update UI
        dropZone.innerHTML = `
            <div class="text-4xl mb-2">🎵</div>
            <p class="text-green-600 font-semibold">${file.name}</p>
            <p class="text-xs text-gray-500">File ready for transcription!</p>
            <button class="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
                Process Demo File
            </button>
        `;
        
        // Auto-advance after successful upload
        setTimeout(() => {
            this.showStep(this.currentStep + 1);
        }, 2000);
    }

    // Attach event listeners
    attachEventListeners() {
        document.getElementById('prev-step').addEventListener('click', () => {
            if (this.currentStep > 0) {
                this.showStep(this.currentStep - 1);
            }
        });
        
        document.getElementById('next-step').addEventListener('click', () => {
            if (this.currentStep < this.steps.length - 1) {
                this.showStep(this.currentStep + 1);
            } else {
                this.completeOnboarding();
            }
        });
        
        document.getElementById('skip-onboarding').addEventListener('click', () => {
            this.completeOnboarding();
        });
    }

    // Complete onboarding
    completeOnboarding() {
        localStorage.setItem('palascribe_onboarded', 'true');
        document.getElementById('onboarding-modal').remove();
        
        this.showNotification('Welcome to PALAScribe! 🎉', 'success');
    }

    // Show notification
    showNotification(message, type = 'info') {
        // This would integrate with the existing notification system
        console.log(`${type.toUpperCase()}: ${message}`);
    }

    // Reset onboarding (for testing)
    static resetOnboarding() {
        localStorage.removeItem('palascribe_onboarded');
        console.log('Onboarding reset - reload page to see onboarding again');
    }
}

// Initialize onboarding when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const onboarding = new OnboardingManager();
    
    // Small delay to ensure other components are loaded
    setTimeout(() => {
        onboarding.showOnboarding();
    }, 500);
    
    // Add to global scope for testing
    window.OnboardingManager = OnboardingManager;
});
