// Server-Side Project Management Module
class ServerProjectManager {
    constructor() {
        this.projects = [];
        this.currentProject = null;
        this.apiBaseUrl = 'http://localhost:8765';
        this.loadProjects();
    }

    // Create a new project on server
    async createProject(projectData) {
        const errors = this.validateProjectData(projectData);
        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: projectData.name.trim(),
                    assignedTo: projectData.assignedTo ? projectData.assignedTo.trim() : ''
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create project');
            }

            const project = await response.json();
            
            // Add to local cache
            this.projects.push(project);
            
            console.log('✅ Project created on server:', project.name);
            return project;
            
        } catch (error) {
            console.error('❌ Error creating project:', error);
            throw error;
        }
    }

    // Load all projects from server
    async loadProjects() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/projects`);
            if (response.ok) {
                const data = await response.json();
                this.projects = data.projects || [];
                console.log(`✅ Loaded ${this.projects.length} projects from server`);
            } else {
                console.warn('⚠️ Could not load projects from server, using empty list');
                this.projects = [];
            }
        } catch (error) {
            console.warn('⚠️ Server not available, using empty project list:', error.message);
            this.projects = [];
        }
    }

    // Get project by ID (from cache or server)
    async getProject(projectId, forceFresh = false) {
        // If forcing fresh data or not in cache, fetch from server
        if (!forceFresh) {
            let project = this.projects.find(p => p.id === projectId);
            if (project) {
                console.log('📋 Returning cached project:', project.name);
                return project;
            }
        }

        // Fetch from server
        try {
            console.log('🌐 Fetching fresh project data from server for:', projectId);
            const response = await fetch(`${this.apiBaseUrl}/projects/${projectId}`);
            if (response.ok) {
                const project = await response.json();
                console.log('📥 Received project data:', {
                    name: project.name,
                    audioUrl: project.audioUrl,
                    audioFilePath: project.audioFilePath
                });
                
                // Update cache
                const index = this.projects.findIndex(p => p.id === projectId);
                if (index >= 0) {
                    this.projects[index] = project;
                } else {
                    this.projects.push(project);
                }
                
                return project;
            }
        } catch (error) {
            console.error('❌ Error fetching project:', error);
        }

        return null;
    }

    // Get project by name (local search)
    getProjectByName(name) {
        return this.projects.find(p => p.name.toLowerCase() === name.toLowerCase());
    }

    // Get all projects (return cached list)
    getAllProjects() {
        return [...this.projects];
    }

    // Update project on server
    async updateProject(projectId, updates) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update project');
            }

            const updatedProject = await response.json();
            
            // Update local cache
            const index = this.projects.findIndex(p => p.id === projectId);
            if (index >= 0) {
                this.projects[index] = updatedProject;
            }

            console.log('✅ Project updated on server:', projectId);
            return updatedProject;
            
        } catch (error) {
            console.error('❌ Error updating project:', error);
            throw error;
        }
    }

    // Delete project from server
    async deleteProject(projectId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/projects/${projectId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete project');
            }

            // Remove from local cache
            this.projects = this.projects.filter(p => p.id !== projectId);
            
            console.log('✅ Project deleted from server:', projectId);
            
        } catch (error) {
            console.error('❌ Error deleting project:', error);
            throw error;
        }
    }

    // Upload audio file for project
    async attachAudioFile(projectId, audioFile, source = 'local', previewMode = false) {
        try {
            console.log(`📎 Uploading audio file for project ${projectId}: ${audioFile.name}`);

            const formData = new FormData();
            formData.append('audio', audioFile);
            formData.append('preview', previewMode ? 'true' : 'false');
            // Include optional sourcePath from the create form if provided
            try {
                const srcEl = document.getElementById('source-path');
                if (srcEl && srcEl.value) {
                    formData.append('sourcePath', srcEl.value);
                }
            } catch (e) {
                console.warn('Could not read source-path element:', e);
            }

            const response = await fetch(`${this.apiBaseUrl}/projects/${projectId}/audio`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to upload audio file');
            }

            const result = await response.json();
            console.log('✅ Audio file uploaded:', result.filename);

            // Update local project cache
            const project = this.projects.find(p => p.id === projectId);
            if (project) {
                project.audio_file_name = audioFile.name;
                project.audio_file_path = result.file_path;
                // Preserve original uploaded name and optional source path if server returned them
                if (result.original_name) project.original_name = result.original_name;
                if (result.source_path) project.source_path = result.source_path;
                project.status = 'processing';
            }

            return result;
            
        } catch (error) {
            console.error('❌ Error uploading audio file:', error);
            console.error('❌ Full error details:', {
                message: error.message,
                stack: error.stack,
                response: error.response || 'No response object'
            });
            throw error;
        }
    }

    // Start transcription for a project
    async transcribeProject(projectId, options = {}) {
        try {
            console.log(`🎙️ Starting transcription for project ${projectId}`);

            const transcriptionParams = {
                model: options.model || 'medium',
                language: options.language || 'English',
                preview: options.preview || false,
                previewDuration: options.previewDuration || 60
            };

            const response = await fetch(`${this.apiBaseUrl}/projects/${projectId}/transcribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transcriptionParams)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to start transcription');
            }

            const result = await response.json();
            
            if (result.success) {
                console.log(`✅ Transcription completed: ${result.word_count} words in ${result.processing_time?.toFixed(1)}s`);
                
                // Update local project cache
                const project = this.projects.find(p => p.id === projectId);
                if (project) {
                    project.transcription = result.transcription;
                    project.formatted_text = result.formatted_text;
                    project.word_count = result.word_count;
                    project.processing_time = result.processing_time;
                    project.status = 'completed';
                }
            } else {
                console.error('❌ Transcription failed:', result.error);
                
                // Update project status to failed
                const project = this.projects.find(p => p.id === projectId);
                if (project) {
                    project.status = 'failed';
                    project.error_message = result.error;
                }
            }

            return result;
            
        } catch (error) {
            console.error('❌ Error during transcription:', error);
            throw error;
        }
    }

    // Process audio using original server endpoint (for backward compatibility)
    async processAudioOriginal(audioFile, options = {}) {
        try {
            console.log(`🎙️ Processing audio with original server: ${audioFile.name}`);

            const formData = new FormData();
            formData.append('audio', audioFile);
            formData.append('model', options.model || 'medium');
            formData.append('language', options.language || 'English');
            formData.append('preview', options.preview ? 'true' : 'false');
            formData.append('previewDuration', options.previewDuration || '60');

            const response = await fetch('http://localhost:8000/process', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                console.log(`✅ Original processing completed: ${result.word_count} words`);
            } else {
                console.error('❌ Original processing failed:', result.error);
            }

            return result;
            
        } catch (error) {
            console.error('❌ Error in original processing:', error);
            throw error;
        }
    }

    // Check backend server status
    async checkBackendStatus() {
        const servers = [
            { name: 'New PALAScribe Server', url: `${this.apiBaseUrl}/health` },
            { name: 'Original Whisper Server', url: 'http://localhost:8000/health' }
        ];

        const status = {};

        for (const server of servers) {
            try {
                const response = await fetch(server.url, { 
                    method: 'GET',
                    timeout: 5000 
                });
                
                if (response.ok) {
                    const data = await response.json();
                    status[server.name] = {
                        available: true,
                        status: 'healthy',
                        service: data.service || server.name
                    };
                } else {
                    status[server.name] = {
                        available: false,
                        status: `HTTP ${response.status}`,
                        error: response.statusText
                    };
                }
            } catch (error) {
                status[server.name] = {
                    available: false,
                    status: 'unavailable',
                    error: error.message
                };
            }
        }

        return status;
    }

    // Search projects (client-side filtering)
    searchProjects(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            return this.getAllProjects();
        }

        const term = searchTerm.toLowerCase();
        return this.projects.filter(project => 
            project.name.toLowerCase().includes(term) ||
            (project.assigned_to && project.assigned_to.toLowerCase().includes(term))
        );
    }

    // Clear all projects (server operation)
    async clearAllProjects() {
        try {
            // Delete all projects one by one
            const deletePromises = this.projects.map(project => 
                this.deleteProject(project.id)
            );
            
            await Promise.all(deletePromises);
            
            this.projects = [];
            console.log('✅ All projects cleared from server');
            
        } catch (error) {
            console.error('❌ Error clearing all projects:', error);
            throw error;
        }
    }

    // Refresh projects from server
    async refreshProjects() {
        await this.loadProjects();
        return this.projects;
    }

    // Validate project data (client-side)
    validateProjectData(projectData) {
        const errors = [];

        if (!projectData.name || projectData.name.trim() === '') {
            errors.push('Project name is required');
        }

        if (projectData.name && projectData.name.trim().length > 100) {
            errors.push('Project name must be less than 100 characters');
        }

        if (projectData.assignedTo && projectData.assignedTo.trim().length > 100) {
            errors.push('Assigned to must be less than 100 characters');
        }

        return errors;
    }

    // Export projects data (from cache)
    exportProjects() {
        const exportData = {
            projects: this.projects.map(project => {
                // Create exportable version (remove server-specific fields)
                const exportableProject = { ...project };
                delete exportableProject.audio_file_path;
                delete exportableProject.audioUrl;
                return exportableProject;
            }),
            exportDate: new Date().toISOString(),
            version: '2.0',
            source: 'server'
        };

        return JSON.stringify(exportData, null, 2);
    }

    // Import projects (upload to server)
    async importProjects(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.projects && Array.isArray(data.projects)) {
                
                // Import each project to server
                const importPromises = data.projects.map(projectData => 
                    this.createProject({
                        name: `${projectData.name} (Imported)`,
                        assignedTo: projectData.assigned_to || projectData.assignedTo || ''
                    })
                );
                
                await Promise.all(importPromises);
                
                // Refresh local cache
                await this.loadProjects();
                
                console.log(`✅ Imported ${data.projects.length} projects to server`);
                return true;
            }
        } catch (error) {
            console.error('❌ Failed to import projects:', error);
        }
        return false;
    }

    // Check server connection
    async checkServerConnection() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`, {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Maintain backward compatibility
class ProjectManager extends ServerProjectManager {
    constructor() {
        super();
        console.log('🔄 Using Server-Side ProjectManager');
    }
}

// Make available globally
window.ProjectManager = ProjectManager;
window.ServerProjectManager = ServerProjectManager;
