import crypto from "crypto";
import { RateLimiterRedis } from "rate-limiter-flexible";
import redisClient from "../db/redis.upstash.js";
import { ApiError } from "../utils/ApiError.js";

const authRateLimiterClient = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "auth_limit",
    points: 100,       // 100 requests 
    duration: 60 * 60, // Per 1 hour
    insuranceLimiter: null,
    blockDuration: 0 
});

export const authRateLimiter = async (req, res, next) => {
    if (!redisClient.isOpen) {
        console.warn("Rate limiter skipped: Redis not connected");
        return next();
    }

    const fingerprint = [
        req.ip,
        req.headers["user-agent"] || "unknown-ua",
        req.headers["accept-language"] || "en"
    ].join("|");

    const key = crypto.createHash("sha256").update(fingerprint).digest("hex");

    try {
        await authRateLimiterClient.consume(key);
        next();
    } catch (error) {
        if (error.msBeforeNext) {
            const retryAfter = Math.round(error.msBeforeNext / 1000) || 1;
            res.set("Retry-After", String(retryAfter));

            return next(
                new ApiError(
                    429,
                    `Too many requests. Try again in ${Math.ceil(retryAfter / 60)} minutes.`
                )
            );
        }
        
        console.error("Rate limiter error:", error);
        next();
    }
};
