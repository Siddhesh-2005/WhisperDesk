import dotenv from "dotenv";
dotenv.config({
    path: "./.env",
});
import { Worker } from "bullmq";
import { getRedisCloudClient } from "../db/redis.cloud.js";
import redisUpstash, { connectRedis } from "../db/redis.upstash.js";
import { Post } from "../models/post.model.js";
import { perspectiveClient } from "../utils/perspective.js";
import { checkWithGemini } from "../utils/gemini.js";
import { isLocalBlacklisted } from "../utils/blacklist.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
//import { notificationQueue } from "../queues/notification.queue.js"; // New Queue
import { groqCLient } from "../utils/groq.js";
import connectDB from "../db/mongo.js";

await connectDB();
await connectRedis();

const postModerationWorker = new Worker(
    "postModerationQueue",
    async (job) => {
        const { postId, imagePath } = job.data;


        const post = await Post.findById(postId);
        if (!post) {


            return;
        }

        try {
            // --- LAYER 1: REGEX (Immediate Exit) ---
            if (
                isLocalBlacklisted(post.content) ||
                isLocalBlacklisted(post.title)
            ) {


                return await finalizePost(
                    post,
                    "REJECTED",
                    "REGEX",
                    "Slur detected."
                );
            }

            // --- LAYER 2: PERSPECTIVE ---
            const textToTest = `${post.title} ${post.content}`;
            const perspectiveResponse = await perspectiveClient(textToTest);
            const toxicity =
                perspectiveResponse.attributeScores.TOXICITY.summaryScore.value;
            const insult =
                perspectiveResponse.attributeScores.INSULT.summaryScore.value;
            const maxScore = Math.max(toxicity, insult);


            if (maxScore > 0.9) {
                return await finalizePost(
                    post,
                    "REJECTED",
                    "PERSPECTIVE",
                    "Abusive content."
                );
            }

            // --- LAYER 3: GEMINI (The "Intelligence" Layer) ---

            console.log(
                `🤖 Calling Gemini for ${maxScore > 0.4 ? "Safety + Meta" : "Meta only"}`
            );

            const groqResult = await groqCLient(post.content, post.category);

            if (groqResult.decision === "REJECTED") {
                return await finalizePost(
                    post,
                    "REJECTED",
                    "GROQ",
                    groqResult.reason
                );
            }

            let imageData = post.image; // Keep existing data if no new upload

            if (imagePath) {
                const upload = await uploadOnCloudinary(imagePath);

                imageData = {
                    url: upload.secure_url,
                    publicId: upload.public_id,
                };
            }

            await finalizePost(post, "PUBLISHED", "GROQ", "", {
                category: groqResult.category,
                tags: groqResult.tags,
                image: imageData,
                scores: { toxicity: maxScore },
            });

        } catch (error) {
            console.error(" Worker Error:", error.message);
            throw error;
        }
    },
    { connection: getRedisCloudClient(), concurrency: 5 }
);

// Helper function
async function finalizePost(post, status, path, reason, extras = {}) {
    post.status = status;
    post.moderation.path = path;
    post.moderation.reason = reason;
    post.moderation.moderatedAt = new Date();

    if (extras.category) post.category = extras.category;
    if (extras.tags) post.tags = extras.tags;
    if (extras.image) {
        post.image = {
            url: extras.image.url,
            publicId: extras.image.publicId,
        };
    }

    if (status === "PUBLISHED") post.publishedAt = new Date();

    await redisUpstash.set(
            `post:likes:init:${post._id}`,
            "1",
            { NX: true } // idempotent, safe on retries
        );

    await post.save();

    // Trigger Notification Queue
    // await notificationQueue.add("send-status-alert", {
    //     userId: post.authorId,
    //     status,
    //     reason,
    //     postTitle: post.title,
    // });
}
