import crypto from "crypto";
import { RateLimiterRedis } from "rate-limiter-flexible";
import ioredisClient from "../db/redis.ioredis.js";
import { ApiError } from "../utils/ApiError.js";

let postRateLimiterClient = null;

const POST_LIMIT_CONFIG = {
    points: 10,                 
    duration: 60 * 60,          
    penaltyPoints: 2,          
    penaltyDuration: 2 * 60    
};

const getOrCreatePostLimiter = () => {
    if (!postRateLimiterClient && ioredisClient.status === "ready") {
        postRateLimiterClient = new RateLimiterRedis({
            storeClient: ioredisClient,
            keyPrefix: "post_limit",
            points: POST_LIMIT_CONFIG.points,
            duration: POST_LIMIT_CONFIG.duration,
            blockDuration: POST_LIMIT_CONFIG.penaltyDuration
        });
    }
    return postRateLimiterClient;
};

export const postRateLimiter = async (req, res, next) => {
    if (ioredisClient.status !== "ready") {
        console.warn("Post rate limiter skipped: Redis not ready");
        return next();
    }

    const limiter = getOrCreatePostLimiter();
    if (!limiter) {
        console.warn("Post rate limiter skipped: Not initialized");
        return next();
    }

    const forwardedFor = req.headers["x-forwarded-for"];
    const ip = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor?.split(",")[0]?.trim() || req.ip;

    const userId = req.user?._id?.toString();
    const fingerprint = userId || ip || "guest";

    const key = crypto.createHash("sha256").update(fingerprint).digest("hex");

    try {
        await limiter.consume(key, 1);
        return next();
    } catch (error) {
      
        try {
            await limiter.penalty(key, POST_LIMIT_CONFIG.penaltyPoints);
        } catch (penaltyError) {
            console.error("Penalty apply failed:", penaltyError);
        }

        if (error.msBeforeNext) {
            const retryAfter = Math.ceil(error.msBeforeNext / 1000) || 1;
            res.set("Retry-After", String(retryAfter));

            return next(
                new ApiError(
                    429,
                    `Posting too fast. Try again in ${Math.ceil(retryAfter / 60)} minutes.`
                )
            );
        }

        console.error("Post rate limiter error:", error);
        return next();
    }
};
