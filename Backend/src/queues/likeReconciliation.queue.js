import { Queue } from "bullmq";
import { getRedisCloudClient } from "../db/redis.cloud.js"; 

export const likeReconciliationQueue = new Queue(
  "likeReconciliationQueue",
  {
    connection: getRedisCloudClient(),
  }
);
