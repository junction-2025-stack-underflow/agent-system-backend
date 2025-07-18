import redisClient from "./redis.client";
import { logError } from "./logger";

const CACHE_TTL: number = parseInt(process.env.CACHE_TTL || "3600", 10);

export const cacheOrQuery = async <T>(
  cacheKey: string,
  query: () => Promise<T>,
  ttl: number = CACHE_TTL
): Promise<{ data: T; cached: boolean }> => {
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return { data: JSON.parse(cached), cached: true };
    }
    const data = await query();
    await redisClient.setEx(cacheKey, ttl, JSON.stringify(data));
    return { data, cached: false };
  } catch (err) {
    logError("Redis error", { error: err, cacheKey });
    const data = await query();
    return { data, cached: false };
  }
};

export { CACHE_TTL };