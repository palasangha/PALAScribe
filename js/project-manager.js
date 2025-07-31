// Project Management Module
class ProjectManager {
    constructor() {
        this.projects = [];
        this.currentProject = null;
        this.loadProjects();
    }

    // Create a new project
    createProject(projectData) {
        const errors = this.validateProjectData(projectData);
        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }

        // Generate unique project name if duplicate exists
        const uniqueName = this.generateUniqueProjectName(projectData.name.trim());

        const project = {
            id: UTILS.generateId(),
            name: uniqueName,
            assignedTo: projectData.assignedTo ? projectData.assignedTo.trim() : '',
            startDate: new Date().toISOString(),
            endDate: null,
            status: CONFIG.PROJECT_STATUS.NEW,
            audioFileName: '',
            audioFile: null,
            generatedDocxPath: '',
            generatedDocxInfo: null,
            reviewedDocxPath: '',
            reviewedDocxInfo: null,
            transcription: '',
            formattedText: '',
            error: null,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };

        this.projects.push(project);
        this.saveProjects();
        
        return project;
    }

    // Validate project data
    validateProjectData(projectData) {
        const errors = [];

        if (!projectData.name || projectData.name.trim() === '') {
            errors.push(CONFIG.ERRORS.INVALID_PROJECT_NAME);
        }

        return errors;
    }

    // Get project by ID
    getProject(projectId) {
        return this.projects.find(p => p.id === projectId);
    }

    // Get project by name
    getProjectByName(name) {
        if (!name || typeof name !== 'string') {
            return null;
        }
        return this.projects.find(p => p && p.name && p.name.toLowerCase() === name.toLowerCase());
    }

    // Generate unique project name by appending _1, _2, etc. if duplicates exist
    generateUniqueProjectName(baseName) {
        let uniqueName = baseName;
        let counter = 1;
        
        // Keep checking for duplicates and incrementing counter
        while (this.getProjectByName(uniqueName)) {
            uniqueName = `${baseName}_${counter}`;
            counter++;
        }
        
        return uniqueName;
    }

    // Get all projects
    getAllProjects() {
        return [...this.projects];
    }

    // Search projects by name
    searchProjects(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            return this.getAllProjects();
        }

        const term = searchTerm.toLowerCase();
        return this.projects.filter(project => 
            project.name.toLowerCase().includes(term) ||
            (project.assignedTo && project.assignedTo.toLowerCase().includes(term))
        );
    }

    // Update project
    updateProject(projectId, updates) {
        const project = this.getProject(projectId);
        if (!project) {
            throw new Error(CONFIG.ERRORS.PROJECT_NOT_FOUND);
        }

        // Apply updates
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                project[key] = updates[key];
            }
        });

        project.updated = new Date().toISOString();
        this.saveProjects();
        
        return project;
    }

    // Attach audio file to project
    attachAudioFile(projectId, audioFile, transcriptionMethod = 'api', previewMode = false) {
        const project = this.getProject(projectId);
        if (!project) {
            throw new Error(CONFIG.ERRORS.PROJECT_NOT_FOUND);
        }

        // Validate audio file with transcription method
        const validationErrors = AudioFileValidator.validateFile(audioFile, transcriptionMethod);
        if (validationErrors.length > 0) {
            throw new Error(validationErrors.join(', '));
        }

        // Update project
        this.updateProject(projectId, {
            audioFile: audioFile,
            audioFileName: audioFile.name,
            audioUrl: URL.createObjectURL(audioFile),
            audioType: audioFile.type,
            status: CONFIG.PROJECT_STATUS.PROCESSING, // Auto-start processing
            transcriptionMethod: transcriptionMethod,
            previewMode: previewMode
        });

        return project;
    }

    // Start audio conversion
    async convertAudio(projectId, apiKey = null) {
        const project = this.getProject(projectId);
        if (!project) {
            throw new Error(CONFIG.ERRORS.PROJECT_NOT_FOUND);
        }

        if (!project.audioFile) {
            throw new Error('No audio file attached to project');
        }

        try {
            // Update status to in progress
            this.updateProject(projectId, {
                status: CONFIG.PROJECT_STATUS.TEXT_GENERATION_INPROGRESS,
                error: null
            });

            // Process audio
            const result = await audioProcessor.processAudio(
                project.audioFile, 
                project.name, 
                apiKey
            );

            if (result.success) {
                // Update project with results
                this.updateProject(projectId, {
                    status: CONFIG.PROJECT_STATUS.READY_FOR_REVIEW,
                    transcription: result.transcription,
                    formattedText: result.formattedText,
                    generatedDocxInfo: result.docxInfo,
                    generatedDocxPath: result.docxInfo.fileName
                });

                return { success: true, project: this.getProject(projectId) };
            } else {
                // Update project with error
                this.updateProject(projectId, {
                    status: CONFIG.PROJECT_STATUS.ERROR,
                    error: result.error
                });

                return { success: false, error: result.error };
            }

        } catch (error) {
            // Update project with error
            this.updateProject(projectId, {
                status: CONFIG.PROJECT_STATUS.ERROR,
                error: error.message
            });

            throw error;
        }
    }

    // Start project review
    startReview(projectId, assignedTo = null) {
        const project = this.getProject(projectId);
        if (!project) {
            throw new Error(CONFIG.ERRORS.PROJECT_NOT_FOUND);
        }

        if (project.status !== CONFIG.PROJECT_STATUS.NEEDS_REVIEW) {
            throw new Error('Project is not ready for review');
        }

        // For simplified workflow, we'll show the review interface
        // and allow marking as approved
        return project;
    }

    // Mark project as approved (simplified review completion)
    approveProject(projectId, reviewerName = null) {
        const project = this.getProject(projectId);
        if (!project) {
            throw new Error(CONFIG.ERRORS.PROJECT_NOT_FOUND);
        }

        if (project.status !== CONFIG.PROJECT_STATUS.NEEDS_REVIEW) {
            throw new Error('Project is not in review state');
        }

        const updates = {
            status: CONFIG.PROJECT_STATUS.APPROVED,
            reviewedBy: reviewerName || 'Anonymous',
            reviewedAt: new Date().toISOString()
        };

        return this.updateProject(projectId, updates);
    }

    // Complete project review
    completeReview(projectId, reviewedDocxInfo = null) {
        const project = this.getProject(projectId);
        if (!project) {
            throw new Error(CONFIG.ERRORS.PROJECT_NOT_FOUND);
        }

        if (project.status !== CONFIG.PROJECT_STATUS.IN_REVIEW) {
            throw new Error('Project is not in review status');
        }

        const updates = {
            status: CONFIG.PROJECT_STATUS.REVIEW_COMPLETE,
            endDate: new Date().toISOString()
        };

        if (reviewedDocxInfo) {
            updates.reviewedDocxInfo = reviewedDocxInfo;
            updates.reviewedDocxPath = reviewedDocxInfo.fileName;
        }

        return this.updateProject(projectId, updates);
    }

    // Delete project
    deleteProject(projectId) {
        const projectIndex = this.projects.findIndex(p => p.id === projectId);
        if (projectIndex === -1) {
            throw new Error(CONFIG.ERRORS.PROJECT_NOT_FOUND);
        }

        // Clean up any blob URLs
        const project = this.projects[projectIndex];
        if (project.generatedDocxInfo && project.generatedDocxInfo.url) {
            URL.revokeObjectURL(project.generatedDocxInfo.url);
        }
        if (project.reviewedDocxInfo && project.reviewedDocxInfo.url) {
            URL.revokeObjectURL(project.reviewedDocxInfo.url);
        }
        if (project.audioUrl) {
            URL.revokeObjectURL(project.audioUrl);
        }

        this.projects.splice(projectIndex, 1);
        this.saveProjects();

        return true;
    }

    // Get projects by status
    getProjectsByStatus(status) {
        return this.projects.filter(p => p.status === status);
    }

    // Get project statistics
    getStatistics() {
        const stats = {
            total: this.projects.length,
            byStatus: {},
            completionRate: 0
        };

        // Count by status
        Object.values(CONFIG.PROJECT_STATUS).forEach(status => {
            stats.byStatus[status] = this.projects.filter(p => p.status === status).length;
        });

        // Calculate completion rate
        const completed = stats.byStatus[CONFIG.PROJECT_STATUS.REVIEW_COMPLETE] || 0;
        stats.completionRate = stats.total > 0 ? (completed / stats.total * 100).toFixed(1) : 0;

        return stats;
    }

    // Download generated document
    downloadGeneratedDocument(projectId) {
        const project = this.getProject(projectId);
        if (!project || !project.generatedDocxInfo) {
            throw new Error('Generated document not found');
        }

        FileDownloadManager.downloadFile(
            project.generatedDocxInfo.url,
            project.generatedDocxInfo.fileName
        );
    }

    // Download reviewed document
    downloadReviewedDocument(projectId) {
        const project = this.getProject(projectId);
        if (!project || !project.reviewedDocxInfo) {
            throw new Error('Reviewed document not found');
        }

        FileDownloadManager.downloadFile(
            project.reviewedDocxInfo.url,
            project.reviewedDocxInfo.fileName
        );
    }

    // Handle reviewed document upload
    uploadReviewedDocument(projectId, file) {
        const project = this.getProject(projectId);
        if (!project) {
            throw new Error(CONFIG.ERRORS.PROJECT_NOT_FOUND);
        }

        // Create blob URL for the uploaded file
        const blob = new Blob([file], { type: file.type });
        const url = URL.createObjectURL(blob);

        const reviewedDocxInfo = {
            fileName: `${UTILS.sanitizeFilename(project.name)}${CONFIG.FILES.DOCX_NAMING.REVIEWED_SUFFIX}`,
            originalFileName: file.name,
            blob: blob,
            url: url,
            size: file.size,
            uploaded: new Date().toISOString()
        };

        return this.updateProject(projectId, {
            reviewedDocxInfo: reviewedDocxInfo,
            reviewedDocxPath: reviewedDocxInfo.fileName
        });
    }

    // Save projects to localStorage
    saveProjects() {
        try {
            // Create serializable version (without file objects and blob URLs)
            const serializableProjects = this.projects.map(project => {
                const { audioFile, ...serializable } = project;
                return serializable;
            });

            localStorage.setItem(
                CONFIG.STORAGE_KEYS.PROJECTS, 
                JSON.stringify(serializableProjects)
            );
        } catch (error) {
            console.error('Failed to save projects:', error);
        }
    }

    // Load projects from localStorage
    loadProjects() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.PROJECTS);
            if (stored) {
                const loadedProjects = JSON.parse(stored);
                // Validate and clean up projects data
                this.projects = loadedProjects.filter(project => {
                    // Ensure project has a valid name property
                    if (!project || typeof project !== 'object') {
                        console.warn('Removing invalid project (not an object):', project);
                        return false;
                    }
                    if (!project.name || typeof project.name !== 'string' || project.name.trim() === '') {
                        console.warn('Removing project with invalid name:', project);
                        return false;
                    }
                    // Ensure project has required properties
                    if (!project.id) {
                        console.warn('Removing project without ID:', project);
                        return false;
                    }
                    return true;
                });
                
                // Save cleaned projects back to storage if any were removed
                if (this.projects.length !== loadedProjects.length) {
                    console.log(`Cleaned up projects: ${loadedProjects.length} → ${this.projects.length}`);
                    this.saveProjects();
                }
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
            this.projects = [];
        }
    }

    // Export projects data
    exportProjects() {
        const exportData = {
            projects: this.projects.map(project => {
                const { audioFile, generatedDocxInfo, reviewedDocxInfo, ...exportableProject } = project;
                return exportableProject;
            }),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        return JSON.stringify(exportData, null, 2);
    }

    // Import projects data
    importProjects(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.projects && Array.isArray(data.projects)) {
                this.projects = [...this.projects, ...data.projects];
                this.saveProjects();
                return true;
            }
        } catch (error) {
            console.error('Failed to import projects:', error);
        }
        return false;
    }

    // Clear all projects
    clearAllProjects() {
        // Clean up any blob URLs first
        this.projects.forEach(project => {
            if (project.generatedDocxInfo && project.generatedDocxInfo.url) {
                URL.revokeObjectURL(project.generatedDocxInfo.url);
            }
            if (project.reviewedDocxInfo && project.reviewedDocxInfo.url) {
                URL.revokeObjectURL(project.reviewedDocxInfo.url);
            }
            if (project.audioUrl) {
                URL.revokeObjectURL(project.audioUrl);
            }
        });

        // Clear all projects
        this.projects = [];
        this.saveProjects();

        return true;
    }
}

// Create global instance
const projectManager = new ProjectManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProjectManager, projectManager };
}
