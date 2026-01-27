import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import { Worker } from "bullmq";
import { getRedisCloudClient } from "../db/redis.cloud.js";
import redisUpstash, { connectRedis } from "../db/redis.upstash.js";
import { Post } from "../models/post.model.js";
import { perspectiveClient } from "../utils/perspective.js";
import { isLocalBlacklisted } from "../utils/blacklist.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { groqCLient } from "../utils/groq.js";
import connectDB from "../db/mongo.js";

await connectDB();
await connectRedis();

const postModerationWorker = new Worker(
  "postModerationQueue",
  async (job) => {
    const { postId, imagePath } = job.data;

    const post = await Post.findById(postId);
    if (!post) return;

    try {
      /* ---------------- LAYER 1: REGEX ---------------- */
      if (
        isLocalBlacklisted(post.title) ||
        isLocalBlacklisted(post.content)
      ) {
        return await finalizePost(
          post,
          "REJECTED",
          "REGEX",
          "Blocked due to restricted language"
        );
      }

      /* ---------------- SAFE SHORT TEXT BYPASS ---------------- */
      const SAFE_SHORT_TEXT = /^[a-z\s]{1,20}$/i;
      const isSafeShort =
        SAFE_SHORT_TEXT.test(post.title) &&
        SAFE_SHORT_TEXT.test(post.content);

      /* ---------------- LAYER 2: PERSPECTIVE ---------------- */
      const textToTest = `${post.title} ${post.content}`;
      const perspectiveResponse = await perspectiveClient(textToTest);

      if (!isSafeShort && !perspectiveResponse.isFallback) {
        const THRESHOLDS = {
          PROFANITY: 0.35,
          SEXUALLY_EXPLICIT: 0.30,
          SEVERE_TOXICITY: 0.45,
          THREAT: 0.40,
          HARASSMENT_THREAT: 0.40,
          INSULT: 0.60,
          HARASSMENT: 0.60,
          IDENTITY_ATTACK: 0.65,
        };

        for (const [attr, threshold] of Object.entries(THRESHOLDS)) {
          const score =
            perspectiveResponse.attributeScores?.[attr]?.summaryScore?.value ?? 0;

          if (score >= threshold) {
            return await finalizePost(
              post,
              "REJECTED",
              "PERSPECTIVE",
              `Flagged by ${attr.toLowerCase()}`
            );
          }
        }
      }

      /* ---------------- LAYER 3: GROQ ---------------- */
      const groqResult = await groqCLient(post.content, post.category);

      if (groqResult.decision === "REJECTED") {
        return await finalizePost(
          post,
          "REJECTED",
          "GROQ",
          groqResult.reason
        );
      }

      /* ---------------- IMAGE UPLOAD ---------------- */
      let imageData = post.image;
      if (imagePath) {
        const upload = await uploadOnCloudinary(imagePath);
        imageData = {
          url: upload.secure_url,
          publicId: upload.public_id,
        };
      }

      /* ---------------- FINALIZE ---------------- */
      await finalizePost(post, "PUBLISHED", "GROQ", "", {
        category: groqResult.category,
        tags: groqResult.tags,
        image: imageData,
      });
    } catch (error) {
      console.error("Worker Error:", error.message);
      throw error;
    }
  },
  { connection: getRedisCloudClient(), concurrency: 5 }
);

/* ---------------- HELPER ---------------- */
async function finalizePost(post, status, path, reason, extras = {}) {
  post.status = status;
  post.moderation.path = path;
  post.moderation.reason = reason;
  post.moderation.moderatedAt = new Date();

  if (extras.category) post.category = extras.category;
  if (extras.tags) post.tags = extras.tags;
  if (extras.image) post.image = extras.image;

  if (status === "PUBLISHED") post.publishedAt = new Date();

  await redisUpstash.set(
    `post:likes:init:${post._id}`,
    "1",
    { NX: true }
  );

  await post.save();
}
