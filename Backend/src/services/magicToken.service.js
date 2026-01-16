import crypto from "crypto";
import redis from "../db/redis.upstash.js";
import { ApiError } from "../utils/ApiError.js";

export const createMagicToken = async (userId) => {
  const rawToken = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const key = `magic_token:${tokenHash}`;

  console.log("🔐 Creating magic token with key:", key);

  const tokenData = {
    userId: userId.toString(),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  };

  console.log("📝 Token data to store:", JSON.stringify(tokenData));

  const result = await redis.hSet(key, tokenData);

  console.log("💾 Redis hSet result:", result);

  // Verify the token was stored
  const verification = await redis.hGetAll(key);
  console.log("✅ Verification read:", JSON.stringify(verification));

  if (!verification || Object.keys(verification).length === 0) {
    console.error("❌ Token verification failed - not stored in Redis!");
    throw new ApiError(500, "Unable to save magic token");
  }

  await redis.expire(key, 900);
  console.log("⏰ Set TTL of 900 seconds on key");

  return rawToken;
};
