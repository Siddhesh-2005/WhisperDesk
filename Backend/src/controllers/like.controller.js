import redisClient from "../db/redis.js";
import { getLuaScript } from "../scripts/loadScripts.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"


export const toggleLike = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  const result = await redisClient.evalSha(
    getLuaScript("toggleLike"),
    {
      keys: [
        `post:likes:${postId}`,
        `user:likes:${userId}`,
        `post:likes:init:${postId}`,
      ],
      arguments: [userId, postId],
    }
  );

  res.status(200).json(
    new ApiResponse (200,{
    success: true,
    liked: Boolean(result[0]),
    likesCount: Number(result[1]),
  },"post liked")
  );
});
