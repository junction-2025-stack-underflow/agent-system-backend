import { createClient, RedisClientType } from "redis";
import { logError } from "./logger";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const redisClient: RedisClientType = createClient({ url: REDIS_URL });
redisClient.on("error", (err) => {
  logError("Redis Client Error", { error: err });
});

(async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis");
  } catch (err) {
    logError("Failed to connect to Redis", { error: err });
  }
})();

export default redisClient;