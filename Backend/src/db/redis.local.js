import IORedis from "ioredis";

const redisLocal = new IORedis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null, // REQUIRED for BullMQ
});

redisLocal.on("connect", () => {
  console.log("Redis connected (Docker)");
});

redisLocal.on("error", (err) => {
  console.error("Redis(Docker) error:", err);
});

export default redisLocal;
