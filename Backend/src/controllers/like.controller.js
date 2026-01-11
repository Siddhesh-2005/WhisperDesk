import redisClient from "../db/redis.js";
import { getLuaScript } from "../scripts/loadScripts.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import fs from "fs";
import path from "path";

export const toggleLike = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

  if (!postId) {
    throw new ApiError(400, "Post ID is required");
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
    const likes = await Like.find(
      { postId },
      { userId: 1 }
    );

    if (likes.length > 0) {
      const userIds = likes.map(l => l.userId.toString());
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
  
  const result = await redisClient.eval(
    scriptContent,
    {
      keys: [postLikesKey, userLikesKey, initKey],
      arguments: [userId, postId],
    }
  );


  
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
