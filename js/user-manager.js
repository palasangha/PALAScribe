// User management module for PALAScribe
class UserManager {
    constructor(authManager) {
        this.authManager = authManager;
        this.users = [];
        this.init();
    }

    init() {
        // Setup event listeners
        document.getElementById('btn-manage-users').addEventListener('click', (e) => {
            e.preventDefault();
            this.loadAndShowUsers();
        });

        // Search functionality
        document.getElementById('search-users').addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
        });
    }

    async loadAndShowUsers() {
        if (!this.authManager.isAdmin()) {
            alert('Only admins can manage users');
            return;
        }

        try {
            const response = await fetch('/users', {
                headers: this.authManager.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to load users');
            }

            const data = await response.json();
            this.users = data.users;
            this.renderUsers();

            // Show users view
            if (window.uiController) {
                window.uiController.showView('users');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            alert('Failed to load users: ' + error.message);
        }
    }

    renderUsers() {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';

        this.users.forEach(user => {
            const row = document.createElement('tr');
            
            const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
            const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never';
            
            const isSuperAdmin = user.isSuperAdmin;
            const roleSelect = isSuperAdmin 
                ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                     👑 Super Admin
                   </span>`
                : `<select class="px-3 py-1 border border-gray-300 rounded-md text-sm user-role-select" data-user-id="${user.id}" data-current-role="${user.role}">
                     <option value="reviewer" ${user.role === 'reviewer' ? 'selected' : ''}>👤 Reviewer</option>
                     <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>👑 Admin</option>
                   </select>`;

            row.innerHTML = `
                <td class="px-6 py-4 text-sm text-gray-900">${user.name || 'Unknown'}</td>
                <td class="px-6 py-4 text-sm text-gray-600">${user.email}</td>
                <td class="px-6 py-4">${roleSelect}</td>
                <td class="px-6 py-4 text-sm text-gray-600">${joinedDate}</td>
                <td class="px-6 py-4 text-sm text-gray-600">${lastLogin}</td>
                <td class="px-6 py-4 text-center text-sm">
                    ${isSuperAdmin ? '<span class="text-xs text-gray-500">Super Admin</span>' : ''}
                </td>
            `;

            tbody.appendChild(row);

            // Add event listener to role select if not super admin
            if (!isSuperAdmin) {
                const select = row.querySelector('.user-role-select');
                if (select) {
                    select.addEventListener('change', (e) => {
                        this.updateUserRole(user.id, e.target.value);
                    });
                }
            }
        });
    }

    filterUsers(searchTerm) {
        const tbody = document.getElementById('users-table-body');
        const rows = tbody.querySelectorAll('tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchTerm.toLowerCase())) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    async updateUserRole(userId, newRole) {
        try {
            const response = await fetch(`/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.authManager.getAuthHeader()
                },
                body: JSON.stringify({ role: newRole })
            });

            if (!response.ok) {
                throw new Error('Failed to update user role');
            }

            console.log(`✅ User role updated to ${newRole}`);
            
            // Show success message
            const data = await response.json();
            alert(data.message || `Role updated successfully to ${newRole}`);

            // Reload users
            this.loadAndShowUsers();
        } catch (error) {
            console.error('Error updating user role:', error);
            alert('Failed to update role: ' + error.message);
            // Reload to revert UI
            this.loadAndShowUsers();
        }
    }
}

// Initialize user manager when auth manager is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.authManager) {
        window.userManager = new UserManager(window.authManager);
    }
});
