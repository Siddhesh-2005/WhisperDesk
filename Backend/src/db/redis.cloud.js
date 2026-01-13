import dotenv from "dotenv"

dotenv.config({
    path: "./.env",
});

import IORedis from "ioredis";

let redisCloud = null;

const parseRedisUrl = (url) => {
  const urlObj = new URL(url);
  return {
    host: urlObj.hostname,
    port: parseInt(urlObj.port) || 6379,
    password: urlObj.password || undefined,
    username: urlObj.username || "default",
    tls: urlObj.protocol === "rediss:" ? {} : undefined,
  };
};

const getRedisCloud = () => {
  if (!redisCloud) {
    const config = parseRedisUrl(process.env.REDIS_CLOUD_URL);
    redisCloud = new IORedis({
      ...config,
      maxRetriesPerRequest: null, // REQUIRED for BullMQ
      enableReadyCheck: false,
    });

    redisCloud.on("error", (err) => console.error("Redis Cloud Client Error", err));
    redisCloud.on("connect", () => console.log("Redis Cloud connected"));
  }
  return redisCloud;
};

export const connectRedisCloud = async () => {
  const client = getRedisCloud();
  // IORedis connects automatically, just verify
  if (client.status !== "ready") {
    await client.ping();
  }
};

export const getRedisCloudClient = () => getRedisCloud();

export default getRedisCloud();
