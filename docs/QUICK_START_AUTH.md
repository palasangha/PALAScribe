# Quick Start Guide - Google OAuth Authentication

## Prerequisites
- Python 3.9+ with virtual environment activated
- Google account
- 15 minutes for Google Cloud Console setup

## Step-by-Step Setup

### 1. Install Dependencies (2 minutes)
```bash
cd /Users/vijayaraghavanvedantham/Documents/GitHub/PALAScribe
source whisper-env/bin/activate
pip install -r requirements.txt
```

### 2. Google Cloud Console Setup (10 minutes)

Visit: https://console.cloud.google.com

1. Create new project: "PALAScribe"
2. Enable Google+ API
3. Configure OAuth consent screen (External)
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized origins: `http://localhost:8000`
6. Add redirect URI: `http://localhost:8000/auth/google/callback`
7. **Copy Client ID and Client Secret**

📖 Detailed instructions: `docs/GOOGLE_OAUTH_SETUP.md`

### 3. Configure Application (2 minutes)

Edit `.env`:
```env
GOOGLE_CLIENT_ID=paste-your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=paste-your-client-secret-here
SUPER_ADMIN_EMAIL=your-email@gmail.com
```

Edit `login.html` (line 7):
```html
<meta name="google-signin-client_id" content="paste-your-client-id-here.apps.googleusercontent.com">
```

Edit `login.html` (line 178):
```javascript
client_id: 'paste-your-client-id-here.apps.googleusercontent.com',
```

### 4. Start Server (1 minute)
```bash
python palascribe_server.py
```

### 5. Test Login
1. Open: http://localhost:8000/login.html
2. Click "Sign in with Google"
3. Authorize the app
4. Should redirect to dashboard

## Your First Admin Login

The first user to log in with the email set in `SUPER_ADMIN_EMAIL` becomes the admin automatically.

## API Endpoints

### Authentication
```bash
# Login (returns JWT token)
POST /auth/google
{
  "token": "google-id-token"
}

# Get current user
GET /auth/me
Headers: Authorization: Bearer <jwt-token>

# Logout
GET /auth/logout
```

### User Management (Admin Only)
```bash
# List all users
GET /users
Headers: Authorization: Bearer <jwt-token>

# Update user role
PUT /users/{user_id}/role
Headers: Authorization: Bearer <jwt-token>
{
  "role": "admin"  # or "reviewer"
}
```

### Project Assignment (Admin Only)
```bash
# Assign project to user
POST /projects/{project_id}/assign
Headers: Authorization: Bearer <jwt-token>
{
  "userId": "user-uuid"
}
```

## Testing the Flow

### Test as Admin:
1. Sign in with your super admin email
2. Create a project (it will be linked to you)
3. API returns your user_id in created_by_user_id

### Test as Reviewer:
1. Sign in with different Google account
2. User is automatically created with 'reviewer' role
3. Use admin account to assign projects to this user

## Troubleshooting

**"Google Auth not available"**
```bash
pip install google-auth google-auth-oauthlib google-auth-httplib2 PyJWT
```

**"redirect_uri_mismatch"**
- Check Google Cloud Console → Credentials
- Ensure `http://localhost:8000/auth/google/callback` is listed
- No trailing slashes!

**"Invalid token"**
- Clear browser localStorage: `localStorage.clear()`
- Check Client ID matches in .env and login.html
- Try incognito mode

**Server won't start**
- Check Python packages installed: `pip list | grep google`
- Check .env file exists and has correct format
- Check port 8000 not already in use: `lsof -i :8000`

## Next Steps

After authentication is working:

1. **Update Dashboard UI** (index-server.html):
   - Add auth check on load
   - Show user profile in header
   - Filter projects by role

2. **Add User Management UI**:
   - Users tab for admins
   - Role toggles
   - Assignment dropdowns

3. **Test Workflow**:
   - Admin creates project
   - Admin assigns to reviewer
   - Reviewer logs in, sees only assigned projects
   - Reviewer edits and saves
   - Admin approves

## Support

- Full setup guide: `docs/GOOGLE_OAUTH_SETUP.md`
- Implementation details: `docs/AUTH_IMPLEMENTATION_SUMMARY.md`
- Google OAuth docs: https://developers.google.com/identity
