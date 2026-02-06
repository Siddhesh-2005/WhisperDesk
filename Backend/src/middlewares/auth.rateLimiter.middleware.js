import crypto from "crypto";
import { RateLimiterRedis } from "rate-limiter-flexible";
import ioredisClient from "../db/redis.ioredis.js";
import { ApiError } from "../utils/ApiError.js";

let authRateLimiterClient = null;

const getOrCreateRateLimiter = () => {
    if (!authRateLimiterClient && ioredisClient.status === "ready") {
        authRateLimiterClient = new RateLimiterRedis({
            storeClient: ioredisClient,
            keyPrefix: "auth_limit",
            points: 100,       // 100 requests 
            duration: 60 * 60, // Per 1 hour
            blockDuration: 0 
        });
    }
    return authRateLimiterClient;
};

export const authRateLimiter = async (req, res, next) => {
    if (ioredisClient.status !== "ready") {
        console.warn("Rate limiter skipped: IORedis not connected");
        return next();
    }

    const rateLimiter = getOrCreateRateLimiter();
    if (!rateLimiter) {
        console.warn("Rate limiter skipped: Could not initialize");
        return next();
    }

    const fingerprint = [
        req.ip,
        req.headers["user-agent"] || "unknown-ua",
        req.headers["accept-language"] || "en"
    ].join("|");

    const key = crypto.createHash("sha256").update(fingerprint).digest("hex");

    try {
        await rateLimiter.consume(key);
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
