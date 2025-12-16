import dotenv from "dotenv";
import connectDB from "./db/mongo.js";
import { connectRedis } from "./db/redis.js";
import { app } from "./app.js";

// load env FIRST
dotenv.config({
  path: "./.env",
});

const startServer = async () => {
  try {
    // connect databases
    await connectDB();
    await connectRedis();

    // start server
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server running on port ${process.env.PORT || 8000}`);
    });
  } catch (err) {
    console.error("Server startup failed:", err);
    process.exit(1);
  }
};

startServer();
