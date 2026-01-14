import dotenv from "dotenv";
import connectDB from "./db/mongo.js";
import { connectRedis } from "./db/redis.upstash.js";
import { connectRedisCloud } from "./db/redis.cloud.js";
import { loadLuaScripts } from "./scripts/loadScripts.js";
import { app } from "./app.js";
import { likeReconciliationQueue } from "./queues/likeReconciliation.queue.js";

// Start workers in the same process
import "./workers/postModeration.worker.js";
import "./workers/likeReconciliation.worker.js";
import "./workers/redisRebuild.worker.js";

// load env FIRST (optional for Render, which injects env directly)
if (process.env.NODE_ENV !== "production") {
    dotenv.config({
        path: "./.env",
    });
}

const startServer = async () => {
    try {
        // connect databases
        await connectDB();
        await connectRedis();
        await connectRedisCloud();
        await loadLuaScripts();

        const job = await likeReconciliationQueue.add(
            "reconcile-likes",
            {},
            {
                repeat: {
                    every: 60 * 1000, // every 60 seconds
                },
                removeOnComplete: true,
                removeOnFail: true,
            }
        );
        console.log("✅ Like reconciliation job scheduled:", job.id);

        // start server
        app.listen(process.env.PORT || 8000, () => {
            console.log(`🚀 Server running on port ${process.env.PORT || 8000}`);
            console.log(`🔄 Workers running in same instance`);
        });
    } catch (err) {
        console.error("Server startup failed:", err);
        process.exit(1);
    }
};

startServer();
