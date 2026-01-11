import { Queue } from "bullmq";
import redis from "../db/redis.local.js"; 

export const likeReconciliationQueue = new Queue(
  "likeReconciliationQueue",
  {
    connection: redis,
  }
);
