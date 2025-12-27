import fs from "fs";
import path from "path";
import redisClient from "../db/redis.js";

const scripts = {};

export async function loadLuaScripts() {
  const scriptPath = path.join(
    process.cwd(),
    "src/scripts/toggleLike.lua"
  );

  const lua = fs.readFileSync(scriptPath, "utf8");

  // Register script and get SHA
  const sha = await redisClient.scriptLoad(lua);

  scripts.toggleLike = sha;
}

export function getLuaScript(name) {
  return scripts[name];
}
