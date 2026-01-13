import { Queue } from "bullmq";
import { getRedisCloudClient } from "../db/redis.cloud.js";

export const postModerationQueue = new Queue("postModerationQueue", {
  connection: getRedisCloudClient(),
});
