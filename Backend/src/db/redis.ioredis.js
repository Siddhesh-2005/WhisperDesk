import Redis from "ioredis";

// Separate ioredis client for rate-limiter-flexible
// This library works better with ioredis for Lua script support
const ioredisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    enableOfflineQueue: false
});

ioredisClient.on("error", (err) => {
    console.error("IORedis Error:", err);
});

ioredisClient.on("connect", () => {
    console.log("IORedis connected (for rate limiter)");
});

export default ioredisClient;
