import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import { Worker } from "bullmq";
import redis from "../db/redis.local.js";
import redisClient from "../db/redis.js";
import connectDB from "../db/mongo.js";
import { Like } from "../models/like.model.js";
import { Post } from "../models/post.model.js";

await connectDB();

// Connect to Upstash Redis


if (!redisClient.isOpen) {
  try {
    await redisClient.connect();

    
    // Test the connection with a unique key
    const testKey = "test:worker:connection:" + Date.now();
    await redisClient.set(testKey, "works");
    const testValue = await redisClient.get(testKey);
    await redisClient.del(testKey);

    

  } catch (error) {
    console.error("❌ Failed to connect to Upstash Redis:", error.message);
    console.error("❌ Error details:", error);
    throw error;
  }
}

const likeReconciliationWorker = new Worker(
  "likeReconciliationQueue",
  async () => {
    // Find all initialized posts
    const initKeys = await redisClient.keys("post:likes:init:*");

    for (const initKey of initKeys) {
      const postId = initKey.split(":").pop();
      const postLikesKey = `post:likes:${postId}`;

      // Redis is the source of truth
      const userIds = await redisClient.sMembers(postLikesKey);

      // 3️ Rebuild Like collection (idempotent)
      await Like.deleteMany({ postId });

      if (userIds.length > 0) {
        const likeDocs = userIds.map((userId) => ({
          postId,
          userId,
        }));

        await Like.insertMany(likeDocs, { ordered: false });
      }

      // 4️ Update counter on Post
      await Post.updateOne(
        { _id: postId },
        { $set: { likesCount: userIds.length } }
      );
    }


  },
  {
    connection: redis,
    concurrency: 1, // VERY IMPORTANT
  }
);

likeReconciliationWorker.on("completed", (job) => {
  // Job completed successfully
});

likeReconciliationWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});

likeReconciliationWorker.on("error", (err) => {
  console.error("❌ Worker error:", err);
});

export default likeReconciliationWorker;
