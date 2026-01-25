# Quick Start Guide - Azure AD Authentication

## Step 1: Install Dependencies
```bash
cd Backend
npm install
```

## Step 2: Azure Portal Setup (5 minutes)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Microsoft Entra ID" (formerly Azure AD)
3. Click "App registrations" → "+ New registration"
4. Fill in:
   - Name: `BlogApp`
   - Redirect URI: `http://localhost:8000/api/v1/users/oauth/callback`
5. After creation, copy:
   - Application (client) ID
   - Directory (tenant) ID
6. Go to "Certificates & secrets" → "+ New client secret"
   - Copy the secret VALUE immediately (you can't see it again!)
7. Go to "API permissions" → Ensure these are present:
   - Microsoft Graph: `User.Read`, `openid`, `profile`, `email`

## Step 3: Configure Environment Variables

Create `Backend/.env`:
```env
# Azure AD Credentials (from Azure Portal)
AZURE_AD_CLIENT_ID=paste-your-client-id-here
AZURE_AD_CLIENT_SECRET=paste-your-client-secret-here
AZURE_AD_TENANT_ID=paste-your-tenant-id-here

# URLs
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# JWT
ACCESS_TOKEN_SECRET=create-a-long-random-string-here
ACCESS_TOKEN_EXPIRY=7d

# Your existing database configs
MONGODB_URI=your-mongodb-uri
REDIS_URL=your-redis-url
# ... other existing variables
```

## Step 4: Start Application

Terminal 1 - Backend:
```bash
cd Backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd Frontend
npm run dev
```

## Step 5: Test Login

1. Open browser: `http://localhost:5173`
2. Click "Sign in with Microsoft"
3. Sign in with your Microsoft account
4. You should be redirected back and authenticated!

## Troubleshooting

### "Reply URL mismatch" error
- Make sure redirect URI in Azure matches exactly: `http://localhost:8000/api/v1/users/oauth/callback`
- No trailing slash, correct protocol (http/https)

### "Failed to acquire token"
- Verify client secret is correct
- Check that secret hasn't expired
- Ensure all three IDs are correct (client, tenant, secret)

### Cookies not being set
- Check `NODE_ENV=development` in .env
- Ensure backend is running on port 8000
- Check browser console for CORS errors

## Need More Help?

See detailed documentation:
- `AZURE_OAUTH_SETUP.md` - Complete setup guide
- `MIGRATION_SUMMARY.md` - What changed and why

## Production Deployment

When deploying to production:
1. Add production redirect URI in Azure Portal
2. Update environment variables with production URLs
3. Set `NODE_ENV=production`
4. Use HTTPS for both frontend and backend
