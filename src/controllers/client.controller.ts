import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import Client from "../models/Client";
import { AuthRequest } from "../types/express";
import redisClient from "../utils/redis.client";
import { logError } from "../utils/logger";
import { cacheOrQuery, CACHE_TTL } from "../utils/cache";
import { readClientRateLimiter, writeClientRateLimiter, requireAgency } from "../utils/rate-limiter";

export const addClient = [
  body("fullName").isString().notEmpty().withMessage("Full name is required"),
  body("telephone").isString().notEmpty().withMessage("Telephone is required"),
  body("email").optional().isEmail().withMessage("Invalid email format"),
  body("preferences.minBudget").isFloat({ min: 0 }).withMessage("Minimum budget is required"),
  body("preferences.maxBudget").isFloat({ min: 0 }).withMessage("Maximum budget is required"),
  body("preferences.desiredArea").isFloat({ min: 0 }).withMessage("Desired area is required"),
  body("preferences.propertyType")
    .isIn(["Apartment", "Villa", "House"])
    .withMessage("Property type must be Apartment, Villa, or House"),
  body("preferences.numberOfKids").isInt({ min: 0 }).withMessage("Number of kids is required"),
  body("preferences.latitude").isFloat().withMessage("Latitude is required"),
  body("preferences.longitude").isFloat().withMessage("Longitude is required"),
  body("type").isString().withMessage("Type is required"),

  // writeClientRateLimiter,
  // requireAgency,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { fullName, telephone, email, preferences, type } = req.body;

      const newClient = new Client({
        fullName,
        telephone,
        email,
        type,
        agencyId: '687ad5afb134148fddb99a64',
        preferences: {
          minBudget: parseFloat(preferences.minBudget),
          maxBudget: parseFloat(preferences.maxBudget),
          desiredArea: parseFloat(preferences.desiredArea),
          propertyType: preferences.propertyType,
          numberOfKids: parseInt(preferences.numberOfKids),
          latitude: parseFloat(preferences.latitude),
          longitude: parseFloat(preferences.longitude),
        },
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
      const { id } = req.params;
      const preferencesId = parseInt(id, 10);
      if (isNaN(preferencesId)) {
        res.status(400).json({ success: false, message: "Invalid client ID" });
        return;
      }
      const cacheKey = `client:${req.agencyId}:prefId:${preferencesId}`;
      const { data: client, cached } = await cacheOrQuery(
        cacheKey,
        async () => {
          const foundClient = await Client.findOne({
            "preferences.ID": preferencesId,
            agencyId: req.agencyId,
          })
            .select("-__v")
            .lean();
          if (!foundClient) {
            throw new Error("Client not found or unauthorized");
          }
          return foundClient;
        },
        CACHE_TTL
      );
      res.status(200).json({ success: true, data: { client }, cached });
    } catch (error: any) {
      logError("Error fetching client by preferences.ID", {
        error,
        agencyId: req.agencyId,
        preferencesId: req.params.id,
      });
      if (error.message === "Client not found or unauthorized") {
        res.status(404).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  },
];