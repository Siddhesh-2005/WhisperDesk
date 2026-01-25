import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { options } from "../constants.js";
import { getAuthCodeUrl, acquireTokenByCode, getUserProfile } from "../config/azureAd.config.js";
import { validateCollegeEmail } from "../services/validateEmail.service.js";
import { generateUniqueUsername } from "../services/generateUsername.service.js";

/**
 * Initiate Azure AD OAuth2 login flow
 * Returns the authorization URL for user to be redirected to
 */
const initiateLogin = asyncHandler(async (req, res) => {
    try {
        const authUrl = await getAuthCodeUrl();
        
        return res
            .status(200)
            .json(new ApiResponse(200, { authUrl }, "Authorization URL generated successfully"));
    } catch (error) {
        console.error("Error initiating login:", error);
        throw new ApiError(500, "Failed to initiate login");
    }
});

/**
 * OAuth2 callback handler
 * Exchanges authorization code for tokens and creates/updates user
 */
const oauthCallback = asyncHandler(async (req, res) => {
    const { code } = req.query;

    if (!code) {
        throw new ApiError(400, "Authorization code missing");
    }

    try {
        // Exchange authorization code for tokens
        const tokenResponse = await acquireTokenByCode(code);
        
        if (!tokenResponse || !tokenResponse.accessToken) {
            throw new ApiError(401, "Failed to acquire access token");
        }

        // Get user profile from Microsoft Graph
        const profile = await getUserProfile(tokenResponse.accessToken);
        
        if (!profile || !profile.mail) {
            throw new ApiError(400, "Failed to retrieve user profile or email");
        }

        const email = profile.mail.toLowerCase();
        const azureId = profile.id;
        const displayName = profile.displayName;

        // Validate college email
        const emailValidation = validateCollegeEmail(email);
        if (!emailValidation.isValid) {
            throw new ApiError(400, "Invalid college email. Please use your institutional email.");
        }

        // Find or create user
        let user = await User.findOne({ $or: [{ email }, { azureId }] });

        if (!user) {
            // Create new user
            const username = await generateUniqueUsername();
            if (!username) {
                throw new ApiError(500, "Unable to generate username");
            }

            user = await User.create({
                username,
                email,
                azureId,
                displayName,
                branch: emailValidation.branch,
                isActive: true,
                emailVerification: true,
                provider: 'azure',
            });
        } else {
            // Update existing user with Azure AD info if not already set
            if (!user.azureId) {
                user.azureId = azureId;
            }
            if (!user.displayName) {
                user.displayName = displayName;
            }
            user.provider = 'azure';
            user.emailVerification = true;
            await user.save();
        }

        // Generate JWT access token
        const accessToken = user.generateAccessToken();

        // Set cookie and redirect to frontend
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const redirectUrl = `${frontendUrl}/auth/callback?success=true`;

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .redirect(redirectUrl);
            
    } catch (error) {
        console.error("OAuth callback error:", error);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const errorUrl = `${frontendUrl}/auth/callback?error=${encodeURIComponent(error.message || "Authentication failed")}`;
        return res.redirect(errorUrl);
    }
});

/**
 * Get current authenticated user details
 */
const getUser = asyncHandler(async (req, res) => {
    res.status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "User details sent successfully"
        ));
});

/**
 * Logout user by clearing access token cookie
 */
const logout = asyncHandler(async (req, res) => {
    res
        .status(200)
        .clearCookie("accessToken", { ...options, expires: new Date(0) })
        .json(new ApiResponse(200, null, "Logout successful"));
});

export { initiateLogin, oauthCallback, getUser, logout };

