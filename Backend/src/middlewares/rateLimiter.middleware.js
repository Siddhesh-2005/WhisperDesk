import crypto from "crypto";
import { RateLimiterRedis } from "rate-limiter-flexible";
import redisClient from "../db/redis.upstash.js";
import { ApiError } from "../utils/ApiError.js";

const authRateLimiterClient = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "auth_limit",
    points: 60,       // 60 requests
    duration: 60 * 60 // Per 1 hour
});

export const authRateLimiter = async (req, res, next) => {
    const fingerprint = [
        req.ip,
        req.headers["user-agent"] || "unknown-ua",
        req.headers["accept-language"] || "en"
    ].join("|");

    const key = crypto.createHash("sha256").update(fingerprint).digest("hex");

    try {
        await authRateLimiterClient.consume(key);
        next();
    } catch (rejRes) {
        const retryAfter = Math.round(rejRes.msBeforeNext / 1000) || 1;

        res.set("Retry-After", String(retryAfter));

        return next(
            new ApiError(
                429,
                `Too many requests. Try again in ${Math.ceil(retryAfter / 60)} minutes.`
            )
        );
    }
};
