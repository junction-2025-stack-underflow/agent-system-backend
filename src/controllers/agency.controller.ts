
import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import Agency from "../models/Agency";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../utils/redis.client";
import { logError } from "../utils/logger";
const CACHE_TTL: number = parseInt(process.env.CACHE_TTL || "3600", 10);
const BCRYPT_SALT_ROUNDS: number = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
const JWT_SECRET: string = process.env.JWT_SECRET || (() => {
  logError("JWT_SECRET is not defined"); 
  throw new Error("JWT_SECRET is not defined");
})();
const addAgencyRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (...args: string[]) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 50,
  keyGenerator: (req: Request) => req.ip || "anonymous",
  message: "Too many agency creation attempts. Please try again later.",
});

const loginRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (...args: string[]) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req: Request) => req.ip || "anonymous",
  message: "Too many login attempts. Please try again later.",
});
const cacheOrQuery = async <T>(
  cacheKey: string,
  query: () => Promise<T>,
  ttl: number
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


export const addAgency = [
  body("name").isString().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Invalid email format"),
  body("password")
    .isString()
    .notEmpty()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("phone").isString().notEmpty().withMessage("Phone is required"),
  body("address.wilaya").isString().notEmpty().withMessage("Wilaya is required"),
  body("address.commune").isString().notEmpty().withMessage("Commune is required"),
  addAgencyRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { name, email, password, phone, address } = req.body;

      const existingAgency = await Agency.findOne({ email }).lean();
      if (existingAgency) {
        res.status(400).json({ success: false, message: "Agency with this email already exists" });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

      const newAgency = new Agency({
        name,
        email,
        password: hashedPassword,
        phone,
        address,
      });

      await newAgency.save();
      await redisClient.del(`agency:${email}`);

      res.status(201).json({
        success: true,
        data: { agencyId: newAgency._id },
        message: "Agency created successfully",
      });
    } catch (error: any) {
      logError("Error creating agency", { error, email: req.body.email }); 
      if (error.name === "ValidationError") {
        res.status(400).json({
          success: false,
          message: "Invalid agency data",
          errors: error.errors,
        });
        return;
      }
      res.status(500).json({ success: false, message: "Server error while creating agency" });
    }
  },
];


export const loginAgency = [
  body("email").isEmail().withMessage("Invalid email format"),
  body("password").isString().notEmpty().withMessage("Password is required"),
  loginRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { email, password } = req.body;

      const cacheKey = `agency:${email}`;
      const { data: agency, cached } = await cacheOrQuery(
        cacheKey,
        async () => {
          const agency = await Agency.findOne({ email })
            .select("name email password phone address")
            .lean();
          if (!agency) {
            throw new Error("Invalid credentials");
          }
          return agency;
        },
        CACHE_TTL
      );

      const isMatch = await bcrypt.compare(password, agency.password);
      if (!isMatch) {
        res.status(401).json({ success: false, message: "Invalid credentials" });
        return;
      }

      const { password: _, ...safeAgency } = agency;
      if (!cached) {
        await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(safeAgency));
      }

      const token = jwt.sign({ agencyId: agency._id }, JWT_SECRET, {
        expiresIn: "1d",
      });

      res.status(200).json({
        success: true,
        data: {
          token,
          agencyId: agency._id,
          name: agency.name,
          email: agency.email,
        },
        message: "Login successful",
      });
    } catch (error: any) {
      logError("Login error", { error, email: req.body.email }); 
      if (error.message === "Invalid credentials") {
        res.status(401).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: "Server error during login" });
    }
  },
];