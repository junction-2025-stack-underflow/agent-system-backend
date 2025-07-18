import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "./redis.client";
import { AuthRequest } from "../types/express";
import { logError } from "./logger";

export const readClientRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (...args: string[]) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 500,
  keyGenerator: (req: AuthRequest) => req.agencyId!,
  message: "Too many requests. Please try again later.",
});

export const writeClientRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (...args: string[]) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req: AuthRequest) => req.agencyId!,
  message: "Too many requests. Please try again later.",
});

export const houseRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      try {
        return await redisClient.sendCommand(args);
      } catch (err) {
        logError("Redis rate limit error", { error: err });
        throw err;
      }
    },
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req: AuthRequest) => req.agencyId!,
  message: "Too many requests. Please try again later.",
  handler: (req: AuthRequest, res: Response) => {
    logError("Rate limit exceeded (house)", { ip: req.ip, agencyId: req.agencyId });
    res.status(429).json({ success: false, message: "Too many requests. Please try again later." });
  },
});

export const requireAgency = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.agencyId) {
    res.status(401).json({ success: false, message: "Unauthorized: Missing agency ID" });
    return;
  }
  next();
};