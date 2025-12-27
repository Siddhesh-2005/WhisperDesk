import { Queue } from "bullmq";
import redis from "../db/redis.local.js";

export const postModerationQueue = new Queue("postModerationQueue", {
  connection: redis,
});
