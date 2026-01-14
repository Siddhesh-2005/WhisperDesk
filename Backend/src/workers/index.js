import "./postModeration.worker.js";
import "./likeReconciliation.worker.js";
import "./redisRebuild.worker.js";

console.log("🚀 All workers started");
console.log("📝 Note: Redis rebuild runs once on cold start");
