# Quick Reference: What's New in PALAScribe

## 🎯 For You (Admin - vijay.vedantham@gmail.com)

### What You See:
- ✅ User profile with avatar in top-right
- ✅ "Manage Users" button to view/change user roles
- ✅ ALL projects on dashboard
- ✅ User name and role in header

### What You Can Do:
- ✅ Create projects
- ✅ Assign projects to reviewers
- ✅ View all projects
- ✅ Manage user roles
- ✅ Promote/demote reviewers to admins

## 👤 For Reviewers

### What They See:
- ✅ User profile with avatar in top-right
- ✅ ONLY projects assigned to them
- ✅ User name and role in header
- ✅ "No projects assigned yet" if none available

### What They Can Do:
- ✅ Edit transcriptions
- ✅ Save reviews
- ✅ Submit work
- ✅ View their profile

## 🔐 How to Start

### 1. Get Google OAuth Credentials (5 mins)
```
Visit: https://console.cloud.google.com
→ Create project "PALAScribe"
→ Enable Google+ API
→ Create OAuth credentials
→ Get Client ID & Secret
```

**See detailed guide:** `docs/GOOGLE_OAUTH_SETUP.md`

### 2. Update Configuration (2 mins)
```env
# .env file
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-secret-here
SUPER_ADMIN_EMAIL=vijay.vedantham@gmail.com  # ✓ Already set!
```

Also update `login.html` (2 places) with Client ID

### 3. Start Server (1 min)
```bash
python palascribe_server.py
```

### 4. Test It! (2 mins)
```
1. Open: http://localhost:8000/login.html
2. Sign in with vijay.vedantham@gmail.com
3. ✅ You're super admin!
4. See all projects + "Manage Users" button
```

## 📱 User Interface

### Header (Top Right):
```
[Avatar] [Name] [Role]  ▼
         ├─ Manage Users (admins only)
         └─ Logout
```

### Dashboard:
- **Admins**: See all projects
- **Reviewers**: See only assigned projects

### Admin Features:
- "Manage Users" button → full user list
- Search users by name/email
- Toggle roles (Admin ↔ Reviewer)
- See join date and last login

## 🎛️ Project Workflow

### Admin Creates Project:
```
1. Click "Start New Project"
2. Upload audio
3. Transcription generated
4. Admin assigns to reviewer
```

### Reviewer Reviews:
```
1. Login
2. See assigned project
3. Edit transcription
4. Save changes
5. Admin reviews and approves
```

## 🆘 Troubleshooting

**"Redirects to login"**
→ Token invalid, need to sign in again

**"No projects showing"** (as reviewer)
→ Admin hasn't assigned any yet

**"Can't see Manage Users"**
→ Only admins see this button

**"Role change not working"**
→ Can't change super admin role

**"Login page shows error"**
→ Google credentials not configured
→ Check `.env` and `login.html` have Client ID

## 📚 Documentation

- `AUTHENTICATION_COMPLETE.md` - Full overview
- `FRONTEND_COMPLETE.md` - What's new
- `docs/GOOGLE_OAUTH_SETUP.md` - Detailed setup
- `docs/QUICK_START_AUTH.md` - API reference

## ✨ Key Files

**Auth Files:**
- `js/auth-manager.js` - Handles login/logout
- `js/user-manager.js` - User management UI

**Updated Files:**
- `index-server.html` - New UI for profile/users
- `js/ui-controller-fixed.js` - Project filtering
- `palascribe_server.py` - Auth endpoints

---

**Status:** ✅ Ready to test! Just need Google OAuth setup.
