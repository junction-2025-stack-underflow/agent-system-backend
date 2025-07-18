import { Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import House from "../models/House";
import { AuthRequest } from "../types/express";
import redisClient from "../utils/redis.client";
import fs from "fs/promises";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { logError } from "../utils/logger"; 
const CACHE_TTL: number = parseInt(process.env.CACHE_TTL || "3600", 10);
const houseRateLimiter = rateLimit({
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


export const addHouse = [
  body("type").isString().notEmpty().withMessage("Type is required"),
  body("location.latitude").isFloat().withMessage("Invalid latitude"),
  body("location.longitude").isFloat().withMessage("Invalid longitude"),
  body("superficie").isFloat({ min: 0 }).withMessage("Invalid surface area"),
  body("nombreChambre").isInt({ min: 0 }).withMessage("Invalid number of bedrooms"),
  body("nombreLits").isInt({ min: 0 }).withMessage("Invalid number of beds"),
  body("nombreSallesDeBain")
    .isInt({ min: 0 })
    .withMessage("Invalid number of bathrooms"),
  body("nombreCuisine").isInt({ min: 0 }).withMessage("Invalid number of kitchens"),
  body("price").isFloat({ min: 0 }).withMessage("Invalid price"),
  body("titre").isString().notEmpty().withMessage("Title is required"),
  body("description").isString().notEmpty().withMessage("Description is required"),
  body("region").isString().notEmpty().withMessage("Region is required"),
  houseRateLimiter,
  requireAgency,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        if (req.files) {
          const files = req.files as Express.Multer.File[];
          await Promise.all(
            files.map((file) =>
              fs.unlink(file.path).catch((err) =>
                logError("Failed to delete file", { error: err, path: file.path }) 
              )
            )
          );
        }
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const {
        type,
        location,
        superficie,
        nombreChambre,
        nombreLits,
        nombreSallesDeBain,
        nombreCuisine,
        wifi,
        television,
        laveLinge,
        parking,
        climatisation,
        chauffage,
        titre,
        description,
        price,
        region,
      } = req.body;

      const images: string[] = (req.files as Express.Multer.File[] | undefined)?.map(
        (file: Express.Multer.File) => file.path
      ) || [];

      const newHouse = new House({
        type,
        agencyId: req.agencyId,
        location: {
          latitude: parseFloat(location.latitude as string),
          longitude: parseFloat(location.longitude as string),
        },
        superficie: parseFloat(superficie as string),
        nombreChambre: parseInt(nombreChambre as string, 10),
        nombreLits: parseInt(nombreLits as string, 10),
        nombreSallesDeBain: parseInt(nombreSallesDeBain as string, 10),
        nombreCuisine: parseInt(nombreCuisine as string, 10),
        wifi: Boolean(wifi),
        television: Boolean(television),
        laveLinge: Boolean(laveLinge),
        parking: Boolean(parking),
        climatisation: Boolean(climatisation),
        chauffage: Boolean(chauffage),
        images,
        titre,
        description,
        price: parseFloat(price as string),
        region,
      });

      await newHouse.save();

      const cacheKeyList = `houses:${req.agencyId}`;
      const cachedHouses = await redisClient.get(cacheKeyList);
      if (cachedHouses) {
        const houses = JSON.parse(cachedHouses);
        houses.push(newHouse);
        await redisClient.setEx(cacheKeyList, CACHE_TTL, JSON.stringify(houses));
      } else {
        await redisClient.del(cacheKeyList);
      }

      const cacheKeyHouse = `house:${req.agencyId}:${newHouse._id}`;
      await redisClient.setEx(cacheKeyHouse, CACHE_TTL, JSON.stringify(newHouse));

      res.status(201).json({
        success: true,
        data: { house: newHouse },
        message: "House added successfully",
      });
    } catch (error: any) {
      if (req.files) {
        const files = req.files as Express.Multer.File[];
        await Promise.all(
          files.map((file) =>
            fs.unlink(file.path).catch((err) =>
              logError("Failed to delete file", { error: err, path: file.path }) 
            )
          )
        );
      }

      logError("Error adding house", { error, agencyId: req.agencyId }); 
      if (error.name === "ValidationError") {
        res.status(400).json({
          success: false,
          message: "Invalid house data",
          errors: error.errors,
        });
        return;
      }
      if (error.message.includes("Invalid file type")) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: "Failed to add house" });
    }
  },
];


export const deleteHouse = [
  houseRateLimiter,
  requireAgency,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id: houseId } = req.params;

      const house = await House.findById(houseId).lean();
      if (!house) {
        res.status(404).json({ success: false, message: "House not found" });
        return;
      }
      if (house.agencyId.toString() !== req.agencyId) {
        res.status(403).json({ success: false, message: "Unauthorized to delete this house" });
        return;
      }

      await House.findByIdAndDelete(houseId);

      const cacheKeyList = `houses:${req.agencyId}`;
      const cachedHouses = await redisClient.get(cacheKeyList);
      if (cachedHouses) {
        const houses = JSON.parse(cachedHouses).filter((h: any) => h._id !== houseId);
        await redisClient.setEx(cacheKeyList, CACHE_TTL, JSON.stringify(houses));
      } else {
        await redisClient.del(cacheKeyList);
      }
      await redisClient.del(`house:${req.agencyId}:${houseId}`);

      res.status(200).json({ success: true, message: "House deleted successfully" });
    } catch (error: any) {
      logError("Error deleting house", { error, agencyId: req.agencyId, houseId: req.params.id }); 
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
];


export const getHousesByAgency = [
  houseRateLimiter,
  requireAgency,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { page = "1", limit = "10" } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const cacheKey = `houses:${req.agencyId}:${pageNum}:${limitNum}`;
      const { data: houses, cached } = await cacheOrQuery(
        cacheKey,
        () =>
          House.find({ agencyId: req.agencyId })
            .select("type location price titre description images")
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean(),
        CACHE_TTL
      );

      res.status(200).json({ success: true, data: { houses }, cached });
    } catch (error: any) {
      logError("Error fetching houses by agency", { error, agencyId: req.agencyId }); 
      res.status(500).json({ success: false, message: "Failed to fetch houses" });
    }
  },
];


export const getHouseById = [
  houseRateLimiter,
  requireAgency,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id: houseId } = req.params;

      const cacheKey = `house:${req.agencyId}:${houseId}`;
      const { data: house, cached } = await cacheOrQuery(
        cacheKey,
        async () => {
          const house = await House.findById(houseId)
            .select("type location price titre description images")
            .lean();
          if (!house) {
            throw new Error("House not found");
          }
          if (house.agencyId.toString() !== req.agencyId) {
            throw new Error("Unauthorized access to this house");
          }
          return house;
        },
        CACHE_TTL
      );

      res.status(200).json({ success: true, data: { house }, cached });
    } catch (error: any) {
      logError("Error retrieving house", { error, agencyId: req.agencyId, houseId: req.params.id }); 
      if (error.message === "House not found") {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      if (error.message === "Unauthorized access to this house") {
        res.status(403).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
];