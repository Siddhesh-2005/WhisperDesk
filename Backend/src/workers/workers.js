import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import "./postModeration.worker.js";
import "./likeReconciliation.worker.js";
import "./redisRebuild.worker.js";

console.log("✅ All workers initialized");
