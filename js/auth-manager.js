// Authentication module for PALAScribe
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authToken = null;
        this.menuSetupComplete = false;
        this.init();
    }

    init() {
        // Load saved auth from localStorage
        this.authToken = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }

        // Check authentication on page load
        this.checkAuth();
    }

    async checkAuth() {
        if (!this.authToken) {
            console.log('No auth token found, redirecting to login');
            this.redirectToLogin();
            return;
        }

        try {
            // Verify token is still valid with server
            const response = await fetch('/auth/me', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (!response.ok) {
                console.log('Token invalid, redirecting to login');
                this.clearAuth();
                this.redirectToLogin();
                return;
            }

            const data = await response.json();
            this.currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            console.log('✅ User authenticated:', this.currentUser.email);
            this.updateUIForUser();
        } catch (error) {
            console.error('Auth check failed:', error);
            this.redirectToLogin();
        }
    }

    updateUIForUser() {
        if (!this.currentUser) return;

        // Update user profile in header
        document.getElementById('user-name').textContent = this.currentUser.name || 'User';
        document.getElementById('user-role').textContent = this.currentUser.role === 'admin' ? '👑 Admin' : '👤 Reviewer';
        document.getElementById('dropdown-user-name').textContent = this.currentUser.name || 'User';
        document.getElementById('dropdown-user-email').textContent = this.currentUser.email;

        // Show Users menu item for admins
        const manageUsersLink = document.getElementById('btn-manage-users');
        if (manageUsersLink) {
            if (this.currentUser.role === 'admin') {
                manageUsersLink.classList.remove('hidden');
            } else {
                manageUsersLink.classList.add('hidden');
            }
        }

        // Setup user menu
        this.setupUserMenu();

        // Filter projects based on role
        this.setupProjectFiltering();
    }

    setupUserMenu() {
        // Prevent duplicate setup
        if (this.menuSetupComplete) {
            return;
        }

        const menuBtn = document.getElementById('user-menu-btn');
        const dropdown = document.getElementById('user-dropdown');
        const logoutBtn = document.getElementById('logout-btn');
        const manageUsersBtn = document.getElementById('btn-manage-users');

        if (!menuBtn || !dropdown) {
            return;
        }

        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });

        // Close menu when clicking outside
        document.addEventListener('click', () => {
            dropdown.classList.add('hidden');
        });

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Manage users navigation
        if (manageUsersBtn) {
            manageUsersBtn.addEventListener('click', (e) => {
                e.preventDefault();
                dropdown.classList.add('hidden');
                if (window.uiController && typeof window.uiController.showView === 'function') {
                    window.uiController.showView('users');
                }
            });
        }

        this.menuSetupComplete = true;
    }

    setupProjectFiltering() {
        // If reviewer, filter projects to only show assigned ones
        if (this.currentUser.role === 'reviewer') {
            console.log('Setting up reviewer project filter');
            // This will be handled by the project filtering code
            window.userRole = 'reviewer';
            window.userId = this.currentUser.id;
        } else {
            window.userRole = 'admin';
            window.userId = this.currentUser.id;
        }
    }

    logout() {
        this.clearAuth();
        window.location.href = '/login.html';
    }

    clearAuth() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        this.authToken = null;
        this.currentUser = null;
    }

    redirectToLogin() {
        window.location.href = '/login.html';
    }

    getAuthHeader() {
        return {
            'Authorization': `Bearer ${this.authToken}`
        };
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    isReviewer() {
        return this.currentUser && this.currentUser.role === 'reviewer';
    }
}

// Initialize auth manager
window.authManager = new AuthManager();
