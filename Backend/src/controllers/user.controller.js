import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendEmail as send } from "../utils/mailer.js";
import { validateCollegeEmail } from "../services/validateEmail.service.js";
import { User } from "../models/user.model.js";
import { generateUniqueUsername } from "../services/generateUsername.service.js";
import { createMagicToken } from "../services/magicToken.service.js";
import redis from "../db/redis.js";
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

    const url =
        "http://localhost:8000/api/v1/users/login?magictoken=" + rawToken;

    send(incomingEmail, url);

    return res
        .status(200)
        .json(new ApiResponse(200, "Email sent successfully"));
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

    const tokenData = await redis.hGetAll(key);

    if (!tokenData || Object.keys(tokenData).length === 0) {
        throw new ApiError(401, "Invalid or expired magic token");
    }

    if (tokenData.usedAt) {
        throw new ApiError(401, "Magic token already used");
    }

    if (new Date(tokenData.expiresAt) < new Date()) {
        throw new ApiError(401, "Magic token expired");
    }

    const user = await User.findById(tokenData.userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    await redis.hSet(key, {
        usedAt: new Date().toISOString(),
    });

    await redis.del(key);

    const accessToken = user.generateAccessToken();

    const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        //.redirect(`${frontendURL}/dashboard?login=success`)
        .json(
            new ApiResponse(
                200,
                {
                    user: {
                        id: user._id,
                        email: user.email,
                        username: user.username,
                    },
                },
                "Login successful"
            )
        );
});

const getUser=asyncHandler(async(req,res)=>{
    res.status(200)
    .json(new ApiResponse(
        200,req.user,"User details sent successfully"
    ))
})

export { sendEmail, login, getUser };
