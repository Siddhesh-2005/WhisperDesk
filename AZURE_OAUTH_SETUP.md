# Azure AD OAuth2 Setup Guide

This guide walks you through setting up Microsoft Azure AD (Entra ID) OAuth2 authentication for your BlogApp.

## Prerequisites

- An Azure account with access to Azure Active Directory (now called Microsoft Entra ID)
- Admin access to register applications in your Azure tenant
- Node.js and npm installed

## Step 1: Install Required Packages

```bash
cd Backend
npm install @azure/msal-node
```

## Step 2: Register Application in Azure Portal

1. **Go to Azure Portal**
   - Visit [https://portal.azure.com](https://portal.azure.com)
   - Sign in with your Microsoft account

2. **Navigate to Microsoft Entra ID (formerly Azure AD)**
   - In the left sidebar, click on "Microsoft Entra ID" (or search for it)
   - If you don't see it, search for "Azure Active Directory" in the search bar

3. **Register a New Application**
   - Click on "App registrations" in the left menu
   - Click "+ New registration"
   - Fill in the details:
     - **Name**: `BlogApp` (or any name you prefer)
     - **Supported account types**: Choose one of:
       - "Accounts in this organizational directory only" (Single tenant - for one organization)
       - "Accounts in any organizational directory" (Multi-tenant - for multiple organizations)
     - **Redirect URI**: 
       - Platform: Web
       - URI: `http://localhost:8000/api/v1/users/oauth/callback` (for development)
   - Click "Register"

4. **Note Your Application (client) ID**
   - After registration, you'll see the "Overview" page
   - Copy the **Application (client) ID** - this is your `AZURE_AD_CLIENT_ID`
   - Copy the **Directory (tenant) ID** - this is your `AZURE_AD_TENANT_ID`

## Step 3: Create Client Secret

1. **Navigate to Certificates & Secrets**
   - In your app registration, click "Certificates & secrets" in the left menu
   - Under "Client secrets", click "+ New client secret"
   - Add a description (e.g., "BlogApp Backend Secret")
   - Choose an expiration period (e.g., 24 months)
   - Click "Add"

2. **Copy the Secret Value**
   - **IMPORTANT**: Copy the secret **Value** immediately (not the Secret ID)
   - This is your `AZURE_AD_CLIENT_SECRET`
   - You won't be able to see this value again once you leave the page

## Step 4: Configure API Permissions

1. **Navigate to API Permissions**
   - In your app registration, click "API permissions" in the left menu
   - You should see "Microsoft Graph" with "User.Read" permission by default
   - If not, click "+ Add a permission":
     - Select "Microsoft Graph"
     - Select "Delegated permissions"
     - Add these permissions:
       - `User.Read`
       - `openid`
       - `profile`
       - `email`
   - Click "Add permissions"

2. **Grant Admin Consent** (if required)
   - If you see a yellow banner saying "Grant admin consent", click it
   - This allows users to sign in without individual consent

## Step 5: Configure Authentication Settings

1. **Navigate to Authentication**
   - In your app registration, click "Authentication" in the left menu
   
2. **Add Redirect URIs**
   - For **Development**: `http://localhost:8000/api/v1/users/oauth/callback`
   - For **Production**: `https://your-production-domain.com/api/v1/users/oauth/callback`
   - Click "Add URI" for each environment you need

3. **Configure Token Settings**
   - Under "Implicit grant and hybrid flows", check:
     - ✅ ID tokens (used for implicit and hybrid flows)
   - Scroll down and click "Save"

## Step 6: Configure Backend Environment Variables

1. **Copy `.env.example` to `.env`**
   ```bash
   cd Backend
   cp .env.example .env
   ```

2. **Update `.env` with your Azure AD credentials**
   ```env
   # Azure AD OAuth2 Configuration
   AZURE_AD_CLIENT_ID=your-application-client-id-from-step-2
   AZURE_AD_CLIENT_SECRET=your-client-secret-from-step-3
   AZURE_AD_TENANT_ID=your-directory-tenant-id-from-step-2

   # URLs
   BACKEND_URL=http://localhost:8000
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development

   # JWT Configuration
   ACCESS_TOKEN_SECRET=your-random-secret-key-at-least-32-chars
   ACCESS_TOKEN_EXPIRY=7d

   # Your existing database and other configs...
   MONGODB_URI=your-mongodb-connection-string
   REDIS_URL=your-redis-url
   ```

## Step 7: Test the Authentication Flow

1. **Start the Backend Server**
   ```bash
   cd Backend
   npm run dev
   ```

2. **Start the Frontend**
   ```bash
   cd Frontend
   npm run dev
   ```

3. **Test Login**
   - Visit `http://localhost:5173`
   - Click "Sign in with Microsoft"
   - You should be redirected to Microsoft login page
   - Sign in with your Microsoft account
   - After successful authentication, you'll be redirected back to the app

## Architecture Overview

### Authentication Flow

```
1. User clicks "Sign in with Microsoft" on Landing Page
   ↓
2. Frontend calls: GET /api/v1/users/oauth/login
   ↓
3. Backend generates Azure AD authorization URL
   ↓
4. User is redirected to Microsoft login page
   ↓
5. User signs in with Microsoft credentials
   ↓
6. Microsoft redirects to: /api/v1/users/oauth/callback?code=...
   ↓
7. Backend exchanges code for access token
   ↓
8. Backend fetches user profile from Microsoft Graph API
   ↓
9. Backend creates/updates user in database
   ↓
10. Backend generates JWT token and sets httpOnly cookie
    ↓
11. Backend redirects to Frontend: /auth/callback?success=true
    ↓
12. Frontend verifies authentication and navigates to /home
```

### Security Features

- **JWT-based sessions**: Stateless authentication using JSON Web Tokens
- **HttpOnly cookies**: Tokens stored in httpOnly cookies (not accessible via JavaScript)
- **SameSite protection**: CSRF protection via SameSite cookie attribute
- **Secure in production**: Cookies only sent over HTTPS in production
- **College email validation**: Only institutional emails are allowed

## Production Deployment

### Update Redirect URIs in Azure

1. Go back to Azure Portal → Your App Registration → Authentication
2. Add production redirect URI: `https://your-domain.com/api/v1/users/oauth/callback`

### Update Environment Variables

```env
# Production environment
NODE_ENV=production
BACKEND_URL=https://your-backend-domain.com
FRONTEND_URL=https://your-frontend-domain.com

# Cookie domain for cross-origin requests
COOKIE_DOMAIN=.yourdomain.com

# Use strong secrets in production
ACCESS_TOKEN_SECRET=generate-a-long-random-secret-here
```

### CORS Configuration

Ensure your backend allows requests from your frontend domain:

```javascript
// In app.js or similar
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true, // Important for cookies
}));
```

## Troubleshooting

### Error: "AADSTS50011: The reply URL specified in the request does not match"

**Solution**: Make sure the redirect URI in your Azure app matches exactly with the one in your backend URL.

### Error: "Failed to acquire access token"

**Solution**: 
- Check that your client secret is correct and hasn't expired
- Verify your tenant ID and client ID are correct
- Ensure API permissions are granted

### Cookies not being set

**Solution**:
- In development, make sure `NODE_ENV=development` (uses `sameSite: 'lax'`)
- In production, ensure both frontend and backend use HTTPS
- Check that `credentials: true` is set in axios config

### "Invalid college email" error

**Solution**: Update the `validateEmail.service.js` to include your college domain.

## Additional Resources

- [Microsoft Identity Platform Documentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/)
- [MSAL Node Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node)
- [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/overview)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check backend logs for detailed error messages
3. Verify all environment variables are set correctly
4. Ensure redirect URIs match exactly (including http/https and trailing slashes)
