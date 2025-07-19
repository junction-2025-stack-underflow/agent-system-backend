import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import Agency from "../models/Agency";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import redisClient from "../utils/redis.client";
import { logError } from "../utils/logger";
import { readClientRateLimiter } from "../utils/rate-limiter";
import { cacheOrQuery } from "../utils/cache";
import { sendConfirmationEmail } from "../utils/email";

const CACHE_TTL: number = parseInt(process.env.CACHE_TTL || "3600", 10);
const BCRYPT_SALT_ROUNDS: number = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
const JWT_SECRET: string = process.env.JWT_SECRET || (() => {
  logError("JWT_SECRET is not defined");
  throw new Error("JWT_SECRET is not defined");
})();

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
  readClientRateLimiter,
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
        confirmed: false,
      });

      await newAgency.save();
      const token = jwt.sign(
        { agencyId: newAgency._id },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
      await sendConfirmationEmail(email, newAgency._id.toString(), token);
      await redisClient.del(`agency:${email}`);
      res.status(201).json({
        success: true,
        data: { agencyId: newAgency._id },
        message: "Agency created successfully. Please confirm your email.",
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
    body("password").isString().notEmpty().withMessage("Password is required"),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("phone").optional().isString().notEmpty().withMessage("Phone must be provided"),
    readClientRateLimiter,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          res.status(400).json({ success: false, errors: errors.array() });
          return;
        }
  
        const { email, phone, password } = req.body;
        console.log("Request body:", req.body); 
  
        if (!email && !phone) {
          res.status(400).json({
            success: false,
            errors: [{ msg: "Either email or phone is required", path: "emailOrPhone" }],
          });
          return;
        }
        const query = email ? { email } : { phone };
        const agency = await Agency.findOne(query).select("+password name email phone address");
  
        console.log("Agency from DB:", agency);
  
        if (!agency) {
          res.status(401).json({ success: false, message: "Invalid credentials" });
          return;
        }
  
        if (!password || !agency.password) {
          logError("Missing password data", {
            email: email || phone,
            hasPasswordInRequest: !!password,
            hasPasswordInDB: !!agency.password,
          });
          res.status(400).json({ success: false, message: "Invalid password data" });
          return;
        }
  
        const isMatch = await bcrypt.compare(password, agency.password);
        if (!isMatch) {
          res.status(401).json({ success: false, message: "Invalid credentials" });
          return;
        }
  
        // Cache non-sensitive agency data
        const cacheKey = `agency:${email || phone}`;
        const { password: _, ...safeAgency } = agency.toObject();
        await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(safeAgency));
  
        const token = jwt.sign({ agencyId: agency._id }, JWT_SECRET, { expiresIn: "1d" });
  
        res.status(200).json({
          success: true,
          data: { token, agencyId: agency._id, name: agency.name, email: agency.email },
          message: "Login successful",
        });
      } catch (error: any) {
        logError("Login error", {
          message: error.message,
          stack: error.stack,
          email: req.body.email || req.body.phone,
        });
        res.status(500).json({ success: false, message: "Server error during login" });
      }
    },
  ];
export const confirmAgencyEmail = async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
  
      if (!token) {
        return res.status(400).json({ success: false, message: "Token is required" });
      }
  
      const decoded = jwt.verify(token as string, JWT_SECRET) as { agencyId: string };
  
      const agency = await Agency.findById(decoded.agencyId);
      if (!agency) {
        return res.status(404).json({ success: false, message: "Agency not found" });
      }
  
      if (agency.isEmailConfirmed) {
        return res.status(200).json({ success: true, message: "Email already confirmed" });
      }
  
      agency.isEmailConfirmed = true;
      await agency.save();
  
      res.status(200).json({ success: true, message: "Email confirmed successfully" });
    } catch (error) {
      logError("Email confirmation error", { error });
      res.status(400).json({ success: false, message: "Invalid or expired confirmation token" });
    }
  };
  