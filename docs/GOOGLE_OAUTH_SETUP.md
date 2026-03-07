# Google OAuth Setup Guide for PALAScribe

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Project name: `PALAScribe`
4. Click "Create"

## Step 2: Enable Google+ API

1. In the Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (unless you have Google Workspace)
3. Click "Create"

**App information:**
- App name: `PALAScribe`
- User support email: your-email@gmail.com
- App logo: (optional)

**App domain:**
- Application home page: `http://localhost:8000`
- Privacy policy: (can skip for development)
- Terms of service: (can skip for development)

**Developer contact:**
- Email: your-email@gmail.com

4. Click "Save and Continue"
5. Scopes: Click "Add or Remove Scopes"
   - Select: `../auth/userinfo.email`
   - Select: `../auth/userinfo.profile`
   - Select: `openid`
6. Click "Save and Continue"
7. Test users: Add your email and any other test users
8. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "+ Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: `PALAScribe Web Client`

**Authorized JavaScript origins:**
```
http://localhost:8000
```

**Authorized redirect URIs:**
```
http://localhost:8000/auth/google/callback
http://localhost:8000
```

5. Click "Create"
6. **Copy the Client ID and Client Secret** (you'll need these next)

## Step 5: Configure Your .env File

1. Open `/Users/vijayaraghavanvedantham/Documents/GitHub/PALAScribe/.env`
2. Replace the placeholder values:

```env
GOOGLE_CLIENT_ID=446108936169b9t9h8g1q6lv1ompmupc96ekv7jtjevb.apps.googleusercontent.com
.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
SUPER_ADMIN_EMAIL=vijay.vedantham@gmail.com
JWT_SECRET_KEY=$(openssl rand -hex 32)
HOST=localhost
PORT=8000
```

## Step 6: Update login.html

1. Open `login.html`
2. Find line 7 and replace with your Client ID:
```html
<meta name="google-signin-client_id" content="YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com">
```

3. Find line 178 and replace:
```javascript
client_id: 'YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com',
```

## Step 7: Install Python Dependencies

```bash
cd /Users/vijayaraghavanvedantham/Documents/GitHub/PALAScribe
source whisper-env/bin/activate
pip install -r requirements.txt
```

## Step 8: Start the Server

```bash
python palascribe_server.py
```

## Step 9: Test Login

1. Open browser to: `http://localhost:8000/login.html`
2. Click "Sign in with Google"
3. Authorize the app
4. You should be redirected to the dashboard

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- Make sure `http://localhost:8000/auth/google/callback` is in your OAuth Authorized redirect URIs
- Check there are no trailing slashes

### "Error: Google Auth not configured"
- Make sure you installed all packages: `pip install -r requirements.txt`
- Check your `.env` file has the correct Client ID and Secret

### "Invalid Google token"
- Make sure the Client ID in `login.html` matches your `.env` file
- Try clearing browser cache and cookies

### Token expires immediately
- Generate a new JWT_SECRET_KEY: `openssl rand -hex 32`
- Update the `.env` file

## Production Deployment

When deploying to production:

1. Update Authorized JavaScript origins and redirect URIs in Google Cloud Console to include your production domain
2. Update `.env` with production URLs
3. Change JWT_SECRET_KEY to a secure random value
4. Consider using HTTPS (required for production)

## Support

For more help:
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for Web](https://developers.google.com/identity/sign-in/web/sign-in)
