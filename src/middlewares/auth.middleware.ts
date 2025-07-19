import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import winston from "winston";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { AuthRequest } from "../types/express"; 
import redisClient from "../utils/redis.client";
const logger = winston.createLogger({
  level: "error",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.File({ filename: "error.log" })],
});
const JWT_SECRET = process.env.JWT_SECRET || (() => {
    logger.error("JWT_SECRET is not defined");
    throw new Error("JWT_SECRET is not defined");
  })();
  
const authRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (...args: string[]) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  keyGenerator: (req: AuthRequest) => req.ip || "anonymous",
  message: "Too many authentication attempts. Please try again later.",
});
interface JwtPayload {
  agencyId: string;
}
export const authenticateAgency = [
  authRateLimiter,
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ success: false, message: "Not authorized: No token provided" });
        return;
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        res.status(401).json({ success: false, message: "Not authorized: Invalid token format" });
        return;
      }

      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.agencyId = decoded.agencyId;
      next();
    } catch (error: any) {
      logger.error("Authentication error", {
        error: error.message,
        ip: req.ip,
        path: req.path,
      });

      if (error.name === "JsonWebTokenError") {
        res.status(401).json({ success: false, message: "Not authorized: Invalid token" });
        return;
      }
      if (error.name === "TokenExpiredError") {
        res.status(401).json({ success: false, message: "Not authorized: Token expired" });
        return;
      }
      res.status(401).json({ success: false, message: "Not authorized: Authentication failed" });
    }
  },
];