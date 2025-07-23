// Main Application Entry Point
class AudioTextConverterApp {
    constructor() {
        this.version = '1.0.0';
        this.initialized = false;
        this.settings = this.loadSettings();
    }

    // Initialize the application
    async init() {
        if (this.initialized) return;

        try {
            console.log(`🎵 PALAScribe v${this.version} Starting...`);

            // Check browser compatibility
            console.log('📱 Checking browser compatibility...');
            this.checkBrowserCompatibility();

            // Initialize components
            console.log('🔧 Initializing components...');
            await this.initializeComponents();

            // Setup global error handling
            console.log('🛡️ Setting up error handling...');
            this.setupErrorHandling();

            // Setup periodic tasks
            console.log('⏰ Setting up periodic tasks...');
            this.setupPeriodicTasks();

            // Mark as initialized
            this.initialized = true;

            console.log('✅ PALAScribe initialized successfully');

            // Hide loading indicator
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }

            // Show welcome message if first time
            if (this.isFirstTime()) {
                this.showWelcomeMessage();
            }

        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            console.error('Error stack:', error.stack);
            
            // Hide loading indicator
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            this.showCriticalError('Failed to initialize application. Please refresh the page.');
        }
    }

    // Check browser compatibility
    checkBrowserCompatibility() {
        const requiredFeatures = [
            'localStorage',
            'FormData',
            'fetch',
            'Promise',
            'URL',
            'Blob'
        ];

        const missingFeatures = requiredFeatures.filter(feature => {
            switch (feature) {
                case 'localStorage':
                    return typeof Storage === 'undefined';
                case 'FormData':
                    return typeof FormData === 'undefined';
                case 'fetch':
                    return typeof fetch === 'undefined';
                case 'Promise':
                    return typeof Promise === 'undefined';
                case 'URL':
                    return typeof URL === 'undefined';
                case 'Blob':
                    return typeof Blob === 'undefined';
                default:
                    return false;
            }
        });

        if (missingFeatures.length > 0) {
            throw new Error(`Browser missing required features: ${missingFeatures.join(', ')}`);
        }

        // Check for modern JavaScript features
        try {
            // Test arrow functions, const/let, template literals
            const test = (x) => `${x}`;
            if (test('test') !== 'test') throw new Error('Arrow functions not supported');
        } catch (error) {
            throw new Error('Modern JavaScript features not supported');
        }
    }

    // Initialize application components
    async initializeComponents() {
        // Initialize UI Controller first
        console.log('🎨 Initializing UI Controller...');
        
        try {
            window.uiController = new UIController();
            console.log('✅ UIController created successfully');
        } catch (error) {
            console.error('❌ Failed to create UIController:', error);
            throw error;
        }
        
        // Verify essential components are available
        const requiredComponents = [
            { name: 'projectManager', component: typeof projectManager !== 'undefined' ? projectManager : null },
            { name: 'audioProcessor', component: typeof audioProcessor !== 'undefined' ? audioProcessor : null },
            { name: 'paliProcessor', component: typeof paliProcessor !== 'undefined' ? paliProcessor : null },
            { name: 'uiController', component: window.uiController }
        ];

        for (const { name, component } of requiredComponents) {
            if (!component) {
                console.warn(`${name} not available, will be initialized on demand`);
            } else {
                console.log(`✅ ${name} initialized successfully`);
            }
        }

        // Load API key if stored
        await this.loadApiKey();

        console.log('📦 Core components checked successfully');
    }

    // Setup global error handling
    setupErrorHandling() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.logError('Global Error', event.error);
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.logError('Unhandled Promise Rejection', event.reason);
        });

        // Handle network errors
        window.addEventListener('offline', () => {
            console.warn('Application went offline');
            if (typeof uiController !== 'undefined' && uiController.showInfoMessage) {
                uiController.showInfoMessage('You are currently offline. Some features may not work.');
            }
        });

        window.addEventListener('online', () => {
            console.log('Application back online');
            if (typeof uiController !== 'undefined' && uiController.showInfoMessage) {
                uiController.showInfoMessage('Connection restored.');
            }
        });
    }

    // Setup periodic tasks
    setupPeriodicTasks() {
        // Auto-save settings periodically
        setInterval(() => {
            this.saveSettings();
        }, CONFIG.UI.AUTO_SAVE_INTERVAL);

        // Cleanup old blob URLs periodically
        setInterval(() => {
            this.cleanupResources();
        }, 60000); // Every minute
    }

    // Load API key from storage
    async loadApiKey() {
        try {
            const storedKey = localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
            if (storedKey) {
                // In a real application, you'd want to encrypt/decrypt this
                CONFIG.OPENAI.API_KEY = storedKey;
            }
        } catch (error) {
            console.warn('Failed to load API key:', error);
        }
    }

    // Save API key to storage
    saveApiKey(apiKey) {
        try {
            if (apiKey) {
                localStorage.setItem(CONFIG.STORAGE_KEYS.API_KEY, apiKey);
                CONFIG.OPENAI.API_KEY = apiKey;
                return true;
            } else {
                localStorage.removeItem(CONFIG.STORAGE_KEYS.API_KEY);
                CONFIG.OPENAI.API_KEY = '';
                return true;
            }
        } catch (error) {
            console.error('Failed to save API key:', error);
            return false;
        }
    }

    // Load application settings
    loadSettings() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS);
            return stored ? JSON.parse(stored) : {
                theme: 'light',
                autoSave: true,
                notifications: true,
                firstTime: true
            };
        } catch (error) {
            console.warn('Failed to load settings:', error);
            return {
                theme: 'light',
                autoSave: true,
                notifications: true,
                firstTime: true
            };
        }
    }

    // Save application settings
    saveSettings() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    }

    // Update a setting
    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }

    // Check if this is the first time running the app
    isFirstTime() {
        return this.settings.firstTime === true;
    }

    // Mark first time as complete
    markFirstTimeComplete() {
        this.updateSetting('firstTime', false);
    }

    // Show welcome message for first-time users
    showWelcomeMessage() {
        const welcomeMessage = `
            Welcome to PALAScribe! 🎵

            This application helps you convert audio files to text with special
            recognition for Pali Buddhist terms.

            Key Features:
            • Upload audio files and convert to text
            • Automatic Pali word recognition and formatting
            • Project management and review workflow
            • Download generated documents

            ${CONFIG.MOCK.ENABLE_MOCK_API ? 
                'Note: Currently running in demo mode with mock transcription.' : 
                'To get started, you\'ll need an OpenAI API key for transcription.'
            }

            Click "Create New Project" to begin!
        `;

        alert(welcomeMessage);
        this.markFirstTimeComplete();
    }

    // Show critical error
    showCriticalError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed inset-0 bg-red-600 text-white flex items-center justify-center z-50';
        errorDiv.innerHTML = `
            <div class="text-center p-8">
                <h1 class="text-3xl font-bold mb-4">Critical Error</h1>
                <p class="text-lg mb-4">${message}</p>
                <button onclick="location.reload()" class="bg-white text-red-600 px-6 py-2 rounded-lg font-semibold">
                    Reload Application
                </button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }

    // Log error for debugging
    logError(type, error) {
        // Handle null or undefined errors gracefully
        if (!error) {
            console.warn('Null or undefined error passed to logError:', type);
            return;
        }

        const errorLog = {
            type: type,
            message: error?.message || error?.toString() || 'Unknown error',
            stack: error?.stack || 'No stack trace available',
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        console.error('Error logged:', errorLog);

        // In a real application, you might send this to a logging service
        // this.sendErrorToLoggingService(errorLog);
    }

    // Cleanup resources to prevent memory leaks
    cleanupResources() {
        // This would be implemented to clean up old blob URLs, etc.
        // For now, it's a placeholder
        console.debug('Resource cleanup check performed');
    }

    // Get application information
    getAppInfo() {
        return {
            version: this.version,
            initialized: this.initialized,
            settings: { ...this.settings },
            projectCount: projectManager.getAllProjects().length,
            browserInfo: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine
            }
        };
    }

    // Export application data
    exportData() {
        return {
            projects: projectManager.exportProjects(),
            paliDictionary: paliProcessor.exportDictionary(),
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: this.version
        };
    }

    // Import application data
    importData(data) {
        try {
            const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

            if (parsedData.projects) {
                projectManager.importProjects(parsedData.projects);
            }

            if (parsedData.paliDictionary) {
                paliProcessor.importDictionary(parsedData.paliDictionary);
            }

            if (parsedData.settings) {
                this.settings = { ...this.settings, ...parsedData.settings };
                this.saveSettings();
            }

            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    // Reset application to defaults
    resetApplication() {
        if (confirm('Are you sure you want to reset the application? This will delete all projects and settings.')) {
            try {
                // Clear all data
                projectManager.clearAllProjects();
                localStorage.removeItem(CONFIG.STORAGE_KEYS.SETTINGS);
                localStorage.removeItem(CONFIG.STORAGE_KEYS.API_KEY);

                // Reset settings
                this.settings = {
                    theme: 'light',
                    autoSave: true,
                    notifications: true,
                    firstTime: true
                };

                // Reload page
                location.reload();
            } catch (error) {
                console.error('Failed to reset application:', error);
                alert('Failed to reset application. Please clear your browser data manually.');
            }
        }
    }
}

// Initialize application when DOM is ready
function initializeApp() {
    try {
        console.log('🚀 Starting application initialization...');
        
        // Create global app instance
        window.audioTextApp = new AudioTextConverterApp();
        
        // Initialize the application
        window.audioTextApp.init().catch(error => {
            console.error('Failed to initialize app:', error);
            window.audioTextApp.showCriticalError(`Initialization failed: ${error.message}`);
        });
        
    } catch (error) {
        console.error('Failed to start application:', error);
        
        // Show basic error message
        document.body.innerHTML = `
            <div class="min-h-screen bg-red-50 flex items-center justify-center">
                <div class="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                    <h1 class="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
                    <p class="text-gray-700 mb-4">Failed to initialize PALAScribe.</p>
                    <p class="text-sm text-gray-500 mb-4">${error.message}</p>
                    <button onclick="location.reload()" class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700">
                        Reload Page
                    </button>
                </div>
            </div>
        `;
    }
}

// Handle both cases: DOM already loaded or still loading
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM already loaded
    initializeApp();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioTextConverterApp };
}
