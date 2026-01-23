import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendEmail as send } from "../utils/mailer.js";
import { validateCollegeEmail } from "../services/validateEmail.service.js";
import { User } from "../models/user.model.js";
import { generateUniqueUsername } from "../services/generateUsername.service.js";
import { createMagicToken } from "../services/magicToken.service.js";
import redis from "../db/redis.upstash.js";
import { options } from "../constants.js";
import crypto from "crypto"

const sendEmail = asyncHandler(async (req, res) => {
    const { incomingEmail } = req.body;

    const email = validateCollegeEmail(incomingEmail);
    if (!email.isValid) {
        throw new ApiError(400, "Invalid college email");
    }

    let user = await User.findOne({ email: incomingEmail });

    // if user does not exist → create
    if (!user) {
        const username = await generateUniqueUsername();
        if (!username) {
            throw new ApiError(500, "Unable to generate username");
        }

        user = await User.create({
            username,
            email: incomingEmail,
            branch: email.branch,
            isActive: true,
            emailVerification: true,
        });
    }

    const userId = user._id.toString();

    const rawToken = await createMagicToken(userId);

    if (!rawToken) {
        throw new ApiError(500, "Unable to generate magic token");
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const url = `${frontendUrl}/auth/callback?token=${rawToken}`;

    await send(incomingEmail, url);

    return res
        .status(200)
        .json(new ApiResponse(200,rawToken, "Email sent successfully"));
});

const login = asyncHandler(async (req, res) => {
    const { magictoken } = req.query;

    if (!magictoken) {
        throw new ApiError(400, "Magic token missing");
    }

    const tokenHash = crypto
        .createHash("sha256")
        .update(magictoken)
        .digest("hex");

    const key = `magic_token:${tokenHash}`;

    console.log("🔍 Looking up token with key:", key);

    const tokenData = await redis.hGetAll(key);

    console.log("📦 Token data from Redis:", JSON.stringify(tokenData));

    if (!tokenData || Object.keys(tokenData).length === 0) {
        console.log("❌ Token not found in Redis");
        throw new ApiError(401, "Token not found - it may have expired or been used");
    }

    if (tokenData.usedAt && tokenData.usedAt !== "") {
        console.log("❌ Token already used at:", tokenData.usedAt);
        throw new ApiError(401, "Magic token already used");
    }

    const now = new Date();
    const expiresAt = new Date(tokenData.expiresAt);
    console.log("⏰ Current time:", now.toISOString());
    console.log("⏰ Token expires at:", tokenData.expiresAt);
    console.log("⏰ Time diff (ms):", expiresAt.getTime() - now.getTime());

    if (expiresAt < now) {
        console.log("❌ Token expired");
        throw new ApiError(401, "Magic token expired");
    }

    const user = await User.findById(tokenData.userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Mark token as used (don't delete - let Redis TTL handle cleanup)
    // This prevents race conditions with duplicate requests
    await redis.hSet(key, {
        usedAt: new Date().toISOString(),
    });

    console.log("✅ Token marked as used, login successful for user:", user.email);

    const accessToken = user.generateAccessToken();

    // Log cookie setting for debugging
    console.log("🍪 Setting cookie with options:", JSON.stringify(options));
    console.log("🍪 Access token generated:", accessToken ? "YES" : "NO");

    // Set cookie and return JSON - frontend will handle navigation
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse(200, { user: { id: user._id, email: user.email, username: user.username } }, "Login successful"));
});

const getUser=asyncHandler(async(req,res)=>{
    res.status(200)
    .json(new ApiResponse(
        200,req.user,"User details sent successfully"
    ))
})

const logout = asyncHandler(async (req, res) => {
    // Clear access token cookie; use same options for consistency
    res
        .status(200)
        .clearCookie("accessToken", { ...options, expires: new Date(0) })
        .json(new ApiResponse(200, "Logout successful"));
});

// Test endpoint to verify cookie setting works
const testCookie = asyncHandler(async (req, res) => {
    const testValue = "test_" + Date.now();
    
    console.log("🧪 Testing cookie with options:", JSON.stringify(options));
    console.log("🧪 Setting test cookie with value:", testValue);
    
    return res
        .status(200)
        .cookie("testCookie", testValue, options)
        .json(new ApiResponse(200, { testValue, options }, "Test cookie set"));
});

export { sendEmail, login, getUser, logout, testCookie };
