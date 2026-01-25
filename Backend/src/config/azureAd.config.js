import { ConfidentialClientApplication } from "@azure/msal-node";

/**
 * Azure AD OAuth2 Configuration for Microsoft Entra ID
 * Requires environment variables:
 * - AZURE_AD_CLIENT_ID
 * - AZURE_AD_CLIENT_SECRET
 * - AZURE_AD_TENANT_ID
 * - BACKEND_URL (for redirect URI)
 */

const msalConfig = {
    auth: {
        clientId: process.env.AZURE_AD_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}`,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                if (process.env.NODE_ENV === 'development') {
                    console.log(message);
                }
            },
            piiLoggingEnabled: false,
            logLevel: process.env.NODE_ENV === 'development' ? 3 : 1, // 3 = Info, 1 = Error
        },
    },
};

// Initialize MSAL client
export const msalClient = new ConfidentialClientApplication(msalConfig);

// OAuth2 request configuration
export const getAuthCodeUrl = async () => {
    const redirectUri = `${process.env.BACKEND_URL}/api/v1/users/oauth/callback`;
    
    const authCodeUrlParameters = {
        scopes: ["user.read", "openid", "profile", "email"],
        redirectUri: redirectUri,
    };

    try {
        const authUrl = await msalClient.getAuthCodeUrl(authCodeUrlParameters);
        return authUrl;
    } catch (error) {
        console.error("Error generating auth URL:", error);
        throw error;
    }
};

// Exchange authorization code for tokens
export const acquireTokenByCode = async (code) => {
    const redirectUri = `${process.env.BACKEND_URL}/api/v1/users/oauth/callback`;
    
    const tokenRequest = {
        code: code,
        scopes: ["user.read", "openid", "profile", "email"],
        redirectUri: redirectUri,
    };

    try {
        const response = await msalClient.acquireTokenByCode(tokenRequest);
        return response;
    } catch (error) {
        console.error("Error acquiring token:", error);
        throw error;
    }
};

// Get user profile from Microsoft Graph API
export const getUserProfile = async (accessToken) => {
    try {
        const response = await fetch("https://graph.microsoft.com/v1.0/me", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user profile: ${response.statusText}`);
        }

        const profile = await response.json();
        return profile;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
    }
};
