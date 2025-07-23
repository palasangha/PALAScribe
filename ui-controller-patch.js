// Quick fix for UI Controller - patch for corrupted functions
console.log('🔧 Loading UI Controller patch...');

// Wait for DOM to be ready, then patch the UIController
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 DOM ready, applying patches...');
    
    // Direct fix: Add event listener to New Project button
    const newProjectBtn = document.getElementById('btn-new-project');
    if (newProjectBtn) {
        console.log('✅ Found New Project button, adding listener');
        newProjectBtn.addEventListener('click', () => {
            console.log('🔔 New Project button clicked (direct patch)');
            showCreateView();
        });
    } else {
        console.error('❌ New Project button not found');
    }
    
    // Direct fix: Add event listener to tabs
    const createTab = document.getElementById('tab-create');
    if (createTab) {
        createTab.addEventListener('click', () => {
            console.log('🔔 Create tab clicked');
            showCreateView();
        });
    }
    
    const projectsTab = document.getElementById('tab-projects');
    if (projectsTab) {
        projectsTab.addEventListener('click', () => {
            console.log('🔔 Projects tab clicked');
            showProjectsView();
        });
    }
    
    // Function to show projects view
    function showProjectsView() {
        console.log('🔄 Showing projects view...');
        
        // Update tab states
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Hide all views
        document.querySelectorAll('.view-content').forEach(view => {
            view.classList.add('hidden');
        });
        
        // Show projects view
        const projectsTab = document.getElementById('tab-projects');
        const projectsView = document.getElementById('view-projects');
        
        if (projectsTab && projectsView) {
            projectsTab.classList.add('active');
            projectsView.classList.remove('hidden');
            console.log('✅ Projects view shown');
            
            // Try to refresh projects list if uiController is available
            if (typeof uiController !== 'undefined' && uiController.refreshProjectsList) {
                uiController.refreshProjectsList();
            }
        }
    }
    
    // Function to show create view
    function showCreateView() {
        console.log('🔄 Showing create view...');
        
        // Update tab states
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Hide all views
        document.querySelectorAll('.view-content').forEach(view => {
            view.classList.add('hidden');
        });
        
        // Show create view
        const createTab = document.getElementById('tab-create');
        const createView = document.getElementById('view-create');
        
        if (createTab && createView) {
            createTab.classList.add('active');
            createView.classList.remove('hidden');
            console.log('✅ Create view shown');
            
            // Reset form
            const form = document.getElementById('create-project-form');
            if (form) {
                form.reset();
                console.log('✅ Form reset');
                
                // Bind form if not already bound
                if (!form.hasAttribute('data-bound')) {
                    form.addEventListener('submit', (e) => {
                        console.log('📝 Form submitted');
                        e.preventDefault();
                        
                        // Call the actual handleCreateProject function
                        if (typeof uiController !== 'undefined' && uiController.handleCreateProject) {
                            console.log('✅ Calling uiController.handleCreateProject');
                            uiController.handleCreateProject();
                        } else if (typeof window.handleCreateProject === 'function') {
                            console.log('✅ Calling global handleCreateProject');
                            window.handleCreateProject();
                        } else {
                            console.error('❌ handleCreateProject function not found');
                            // Fallback: basic form processing
                            handleCreateProjectFallback();
        if (projectsTab && projectsView) {
            projectsTab.classList.add('active');
            projectsView.classList.remove('hidden');
            console.log('✅ Projects view shown');
            
            // Try to refresh projects list if uiController is available
            if (typeof uiController !== 'undefined' && uiController.refreshProjectsList) {
                uiController.refreshProjectsList();
            }
        }
    }
    
    // Fallback function for creating projects if original is broken
    function handleCreateProjectFallback() {
        console.log('🔄 Using fallback project creation...');
        
        const projectName = document.getElementById('project-name')?.value?.trim();
        const assignedTo = document.getElementById('assigned-to')?.value?.trim();
        const audioFile = document.getElementById('project-audio-file')?.files[0];
        const previewMode = document.getElementById('project-preview-mode')?.checked;
        
        console.log('📝 Form data:', { projectName, assignedTo, audioFile: audioFile?.name, previewMode });
        
        if (!projectName) {
            alert('Please enter a project name');
            return;
        }
        
        if (!audioFile) {
            alert('Please select an audio file');
            return;
        }
        
        // Try to use projectManager if available
        if (typeof projectManager !== 'undefined' && projectManager.createProject) {
            try {
                const project = projectManager.createProject({
                    name: projectName,
                    assignedTo: assignedTo
                });
                
                console.log('✅ Project created:', project.id);
                alert(`Project "${projectName}" created successfully! (ID: ${project.id})`);
                
                // Reset form and go back to projects
                const form = document.getElementById('create-project-form');
                if (form) form.reset();
                showProjectsView();
                
            } catch (error) {
                console.error('❌ Error creating project:', error);
                alert('Error creating project: ' + error.message);
            }
        } else {
            console.error('❌ projectManager not available');
            alert('Project manager not available. Please refresh the page and try again.');
        }
    }
    
    console.log('✅ Direct patch applied');
});         console.error('❌ Create view elements not found');
        }
    }
    
    // Function to show projects view
    function showProjectsView() {
        console.log('🔄 Showing projects view...');
        
        // Update tab states
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Hide all views
        document.querySelectorAll('.view-content').forEach(view => {
            view.classList.add('hidden');
        });
        
        // Show projects view
        const projectsTab = document.getElementById('tab-projects');
        const projectsView = document.getElementById('view-projects');
        
        if (projectsTab && projectsView) {
            projectsTab.classList.add('active');
            projectsView.classList.remove('hidden');
            console.log('✅ Projects view shown');
        }
    }
    
    // Fallback function for creating projects if original is broken
    function handleCreateProjectFallback() {
        console.log('🔄 Using fallback project creation...');
        
        const projectName = document.getElementById('project-name')?.value?.trim();
        const assignedTo = document.getElementById('assigned-to')?.value?.trim();
        const audioFile = document.getElementById('project-audio-file')?.files[0];
        const previewMode = document.getElementById('project-preview-mode')?.checked;
        
        console.log('📝 Form data:', { projectName, assignedTo, audioFile: audioFile?.name, previewMode });
        
        if (!projectName) {
            alert('Please enter a project name');
            return;
        }
        
        if (!audioFile) {
            alert('Please select an audio file');
            return;
        }
        
        // Try to use projectManager if available
        if (typeof projectManager !== 'undefined' && projectManager.createProject) {
            try {
                const project = projectManager.createProject({
                    name: projectName,
                    assignedTo: assignedTo
                });
                
                console.log('✅ Project created:', project.id);
                alert(`Project "${projectName}" created successfully! (ID: ${project.id})`);
                
                // Reset form and go back to projects
                const form = document.getElementById('create-project-form');
                if (form) form.reset();
                showProjectsView();
                
            } catch (error) {
                console.error('❌ Error creating project:', error);
                alert('Error creating project: ' + error.message);
            }
        } else {
            console.error('❌ projectManager not available');
            alert('Project manager not available. Please refresh the page and try again.');
        }
    }
    
    console.log('✅ Direct patch applied');
});
