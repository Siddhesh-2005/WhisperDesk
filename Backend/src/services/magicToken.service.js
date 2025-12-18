import crypto from "crypto";
import redis from "../db/redis.js";
import { ApiError } from "../utils/ApiError.js";

export const createMagicToken = async (userId) => {
  const rawToken = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const key = `magic_token:${tokenHash}`;

  const magicToken= await redis.hSet(key, {
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    usedAt: ""
  });

  if (!magicToken) {
    throw new ApiError(500,"Unable to save magic token")
  }

  await redis.expire(key, 900);

  return rawToken;
};
