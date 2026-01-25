import redisClient from "../db/redis.upstash.js";
import { getLuaScript } from "../scripts/loadScripts.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

export const toggleLike = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { postId } = req.params;

    if (!postId) {
        throw new ApiError(400, "Post ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
        throw new ApiError(400, "That is not a real Post ID!");
    }

    // Ensure Redis is connected
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }

    const initKey = `post:likes:init:${postId}`;
    const postLikesKey = `post:likes:${postId}`;
    const userLikesKey = `user:likes:${userId}`;

    const isInitialized = await redisClient.exists(initKey);

    if (!isInitialized) {
        const likes = await Like.find({ postId }, { userId: 1 });

        if (likes.length > 0) {
            const userIds = likes.map((l) => l.userId.toString());
            await redisClient.sAdd(postLikesKey, userIds);

            for (const uid of userIds) {
                await redisClient.sAdd(`user:likes:${uid}`, postId);
            }
        }

        await redisClient.set(initKey, "1");
    }

    // Load and execute Lua script
    const scriptPath = path.join(process.cwd(), "src/scripts/toggleLike.lua");
    const scriptContent = fs.readFileSync(scriptPath, "utf8");

    const result = await redisClient.eval(scriptContent, {
        keys: [postLikesKey, userLikesKey, initKey],
        arguments: [userId, postId],
    });

    res.status(200).json(
        new ApiResponse(
            200,
            {
                liked: Boolean(result[0]),
                likesCount: Number(result[1]),
            },
            "Post like toggled"
        )
    );
});

// Get all posts liked by user
export const getUserLikes = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Ensure Redis is connected
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }

    const userLikesKey = `user:likes:${userId}`;
    const postIds = await redisClient.sMembers(userLikesKey);

    if (postIds.length === 0) {
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {
                        likes: [],
                        pagination: {
                            currentPage: 1,
                            totalPages: 0,
                            totalLikes: 0,
                        },
                    },
                    "No likes found"
                )
            );
    }

    // Get paginated subset
    const paginatedPostIds = postIds.slice(skip, skip + limit);

    // Fetch post details from MongoDB
    const { Post } = await import("../models/post.model.js");
    const posts = await Post.find({
        _id: { $in: paginatedPostIds },
        status: "PUBLISHED",
        isDeleted: false,
    })
        .populate("authorId", "username")
        .lean();

    const pagination = {
        currentPage: page,
        totalPages: Math.ceil(postIds.length / limit),
        totalLikes: postIds.length,
        hasNextPage: page < Math.ceil(postIds.length / limit),
        hasPrevPage: page > 1,
    };

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { likes: posts, pagination },
                "User likes retrieved successfully"
            )
        );
});

// Get users who liked a specific post
export const getPostLikes = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!postId) {
        throw new ApiError(400, "Post ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
        throw new ApiError(400, "That is not a real Post ID!");
    }

    // Ensure Redis is connected
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }

    const postLikesKey = `post:likes:${postId}`;
    const initKey = `post:likes:init:${postId}`;

    // Check if initialized
    const isInitialized = await redisClient.exists(initKey);

    if (!isInitialized) {
        // Load from MongoDB
        const likes = await Like.find({ postId }, { userId: 1 });

        if (likes.length > 0) {
            const userIds = likes.map((l) => l.userId.toString());
            await redisClient.sAdd(postLikesKey, userIds);
        }

        await redisClient.set(initKey, "1");
    }

    const userIds = await redisClient.sMembers(postLikesKey);
    const totalLikes = userIds.length;

    // Get paginated subset
    const paginatedUserIds = userIds.slice(skip, skip + limit);

    // Fetch user details
    const { User } = await import("../models/user.model.js");
    const users = await User.find(
        { _id: { $in: paginatedUserIds } },
        { username: 1 }
    ).lean();

    const pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalLikes / limit),
        totalLikes,
        hasNextPage: page < Math.ceil(totalLikes / limit),
        hasPrevPage: page > 1,
    };

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { users, pagination },
                "Post likes retrieved successfully"
            )
        );
});

// Check if current user has liked a post
export const checkLikeStatus = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { postId } = req.params;

    if (!postId) {
        throw new ApiError(400, "Post ID is required");
    }

    // Ensure Redis is connected
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }

    const postLikesKey = `post:likes:${postId}`;
    const initKey = `post:likes:init:${postId}`;

    // Check if initialized
    const isInitialized = await redisClient.exists(initKey);

    if (!isInitialized) {
        // Load from MongoDB
        const likes = await Like.find({ postId }, { userId: 1 });

        if (likes.length > 0) {
            const userIds = likes.map((l) => l.userId.toString());
            await redisClient.sAdd(postLikesKey, userIds);
        }

        await redisClient.set(initKey, "1");
    }

    const isLiked = await redisClient.sIsMember(postLikesKey, userId);
    const likesCount = await redisClient.sCard(postLikesKey);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isLiked, likesCount },
                "Like status retrieved successfully"
            )
        );
});
