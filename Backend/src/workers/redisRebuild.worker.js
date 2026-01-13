import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import connectDB from "../db/mongo.js";
import redisClient from "../db/redis.upstash.js";
import { Like } from "../models/like.model.js";
import { Post } from "../models/post.model.js";

const rebuildRedisFromMongo = async () => {
  console.log("🔁 Redis rebuild started");

  await connectDB();
  
  // Connect to Upstash Redis
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("🔌 Upstash Redis connected for rebuild");
  }

  const keys = await redisClient.keys("post:likes:init:*");
  const hasAnyInitKey = keys.length > 0;

  if (hasAnyInitKey) {
    console.log("✅ Redis already initialized, skipping rebuild");
    return;
  }

  console.log("⚠️ Redis cold detected, rebuilding from Mongo");

  const posts = await Post.find(
    { status: "PUBLISHED", isDeleted: false },
    { _id: 1 }
  );

  for (const post of posts) {
    const postId = post._id.toString();

    const likes = await Like.find(
      { postId },
      { userId: 1 }
    );

    if (likes.length > 0) {
      const userIds = likes.map((l) => l.userId.toString());

      await redisClient.sAdd(
        `post:likes:${postId}`,
        userIds
      );

      // Optional: rebuild reverse index
      for (const userId of userIds) {
        await redisClient.sAdd(
          `user:likes:${userId}`,
          postId
        );
      }
    }

    await redisClient.set(`post:likes:init:${postId}`, "1");
  }

  console.log("✅ Redis rebuild completed");
};

rebuildRedisFromMongo()
  .catch((err) => {
    console.error("❌ Redis rebuild failed:", err);
    process.exit(1);
  });
