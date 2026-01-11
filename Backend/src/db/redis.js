import { createClient } from "redis";

let redisClient = null;

const getRedisClient = () => {
    if (!redisClient) {
        redisClient = createClient({
            url: process.env.REDIS_URL,
        });

        redisClient.on("error", (err) => {
            console.error("Redis Error:", err);
        });
    }
    return redisClient;
};

export const connectRedis = async () => {
    const client = getRedisClient();
    if (!client.isOpen) {
        await client.connect();
        console.log("Redis connected");
    }
};

// Export a Proxy that forwards all calls to the lazy-initialized client
export default new Proxy({}, {
    get(target, prop) {
        const client = getRedisClient();
        const value = client[prop];
        return typeof value === 'function' ? value.bind(client) : value;
    }
});
