import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import Client from "../models/Client";
import { AuthRequest } from "../types/express";
import redisClient from "../utils/redis.client";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { logError } from "../utils/logger"; 
const CACHE_TTL: number = parseInt(process.env.CACHE_TTL || "3600", 10);
const readClientRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (...args: string[]) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000, 
  max: 500, 
  keyGenerator: (req: AuthRequest) => req.agencyId!, 
  message: "Too many requests. Please try again later.",
});
const writeClientRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (...args: string[]) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  keyGenerator: (req: AuthRequest) => req.agencyId!, 
  message: "Too many requests. Please try again later.",
});
const requireAgency = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.agencyId) {
    res.status(401).json({ success: false, message: "Unauthorized: Missing agency ID" });
    return;
  }
  next();
};
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
export const addClient = [
  body("fullName").isString().notEmpty().withMessage("Full name is required"),
  body("telephone").isString().notEmpty().withMessage("Telephone is required"),
  body("email").optional().isEmail().withMessage("Invalid email format"),
  body("budget").isFloat({ min: 0 }).withMessage("Budget must be a positive number"),
  body("superficie").optional().isFloat({ min: 0 }).withMessage("Invalid surface area"),
  body("region").optional().isString().withMessage("Region must be a string"),
  body("besoin").optional().isString().withMessage("Besoin must be a string"),
  body("nombreChambre").optional().isInt({ min: 0 }).withMessage("Invalid number of bedrooms"),
  body("status").optional().isString().withMessage("Status must be a string"),
  writeClientRateLimiter,
  requireAgency,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const {
        fullName,
        telephone,
        email,
        budget,
        superficie,
        region,
        besoin,
        nombreChambre,
        status,
      } = req.body;

      const newClient = new Client({
        fullName,
        telephone,
        email,
        budget: parseFloat(budget as string),
        superficie: superficie ? parseFloat(superficie as string) : undefined,
        region,
        besoin,
        nombreChambre: nombreChambre ? parseInt(nombreChambre as string, 10) : undefined,
        status,
        agencyId: req.agencyId,
      });

      await newClient.save();

      const cacheKeyList = `clients:${req.agencyId}`;
      const cachedClients = await redisClient.get(cacheKeyList);
      if (cachedClients) {
        const clients = JSON.parse(cachedClients);
        clients.push(newClient);
        await redisClient.setEx(cacheKeyList, CACHE_TTL, JSON.stringify(clients));
      } else {
        await redisClient.del(cacheKeyList);
      }

      const cacheKeyClient = `client:${req.agencyId}:${newClient._id}`;
      await redisClient.setEx(cacheKeyClient, CACHE_TTL, JSON.stringify(newClient));

      res.status(201).json({
        success: true,
        data: { client: newClient },
        message: "Client added successfully",
      });
    } catch (error: any) {
      logError("Error adding client", { error, agencyId: req.agencyId }); 
      if (error.name === "ValidationError") {
        res.status(400).json({
          success: false,
          message: "Invalid client data",
          errors: error.errors,
        });
        return;
      }
      res.status(500).json({ success: false, message: "Failed to add client" });
    }
  },
];


export const deleteClient = [
  writeClientRateLimiter,
  requireAgency,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id: clientId } = req.params;

      const client = await Client.findOne({ _id: clientId, agencyId: req.agencyId }).lean();
      if (!client) {
        res.status(404).json({ success: false, message: "Client not found or unauthorized" });
        return;
      }

      await Client.findByIdAndDelete(clientId);

      const cacheKeyList = `clients:${req.agencyId}`;
      const cachedClients = await redisClient.get(cacheKeyList);
      if (cachedClients) {
        const clients = JSON.parse(cachedClients).filter((c: any) => c._id !== clientId);
        await redisClient.setEx(cacheKeyList, CACHE_TTL, JSON.stringify(clients));
      } else {
        await redisClient.del(cacheKeyList);
      }
      await redisClient.del(`client:${req.agencyId}:${clientId}`);

      res.status(200).json({ success: true, message: "Client deleted successfully" });
    } catch (error: any) {
      logError("Error deleting client", { error, agencyId: req.agencyId, clientId: req.params.id }); 
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
];


export const getAllClients = [
  readClientRateLimiter,
  requireAgency,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { page = "1", limit = "10" } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const cacheKey = `clients:${req.agencyId}:${pageNum}:${limitNum}`;
      const { data: clients, cached } = await cacheOrQuery(
        cacheKey,
        () =>
          Client.find({ agencyId: req.agencyId })
            .select("fullName telephone email budget status")
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean(),
        CACHE_TTL
      );

      res.status(200).json({ success: true, data: { clients }, cached });
    } catch (error: any) {
      logError("Error fetching clients", { error, agencyId: req.agencyId }); 
      res.status(500).json({ success: false, message: "Failed to fetch clients" });
    }
  },
];


export const getClientById = [
  readClientRateLimiter,
  requireAgency,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id: clientId } = req.params;

      const cacheKey = `client:${req.agencyId}:${clientId}`;
      const { data: client, cached } = await cacheOrQuery(
        cacheKey,
        async () => {
          const client = await Client.findOne({ _id: clientId, agencyId: req.agencyId })
            .select("fullName telephone email budget status")
            .lean();
          if (!client) {
            throw new Error("Client not found or unauthorized");
          }
          return client;
        },
        CACHE_TTL
      );

      res.status(200).json({ success: true, data: { client }, cached });
    } catch (error: any) {
      logError("Error fetching client", { error, agencyId: req.agencyId, clientId: req.params.id }); 
      if (error.message === "Client not found or unauthorized") {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
];