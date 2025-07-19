import { Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import House from '../models/House';
import { AuthRequest } from '../types/express';
import redisClient from '../utils/redis.client';
import fs from 'fs/promises';
import { logError } from '../utils/logger';
import { cacheOrQuery, CACHE_TTL } from '../utils/cache';
import { houseRateLimiter, requireAgency } from '../utils/rate-limiter';

export const addHouse = [
  body('nombreLits').isInt({ min: 0 }).withMessage('Invalid number of beds'),
  body('nombreSallesDeBain')
    .isInt({ min: 0 })
    .withMessage('Invalid number of bathrooms'),
  body('nombreCuisine')
    .isInt({ min: 0 })
    .withMessage('Invalid number of kitchens'),
  body('titre').isString().notEmpty().withMessage('Title is required'),
  body('description')
    .isString()
    .notEmpty()
    .withMessage('Description is required'),
  body('region').isString().notEmpty().withMessage('Region is required'),
  houseRateLimiter,
  // requireAgency,
  async (req: AuthRequest, res: Response): Promise<void | Response> => {
    try {
      const validationErrors = validationResult(req);
      const {
        details,
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
        region,
        agencyId,
      } = req.body;
      console.log('agency id', agencyId);
      console.log('body', req.body);
      const parsedDetails =
        typeof details === 'string' ? JSON.parse(details) : details;
      const customErrors: any[] = [];
      if (
        !['House', 'Villa', 'Apartment'].includes(parsedDetails.PropertyType)
      ) {
        customErrors.push({
          msg: 'Property type must be House, Villa, or Apartment',
          path: 'details.PropertyType',
        });
      }
      if (isNaN(parseFloat(parsedDetails.Latitude))) {
        customErrors.push({
          msg: 'Invalid latitude',
          path: 'details.Latitude',
        });
      }
      if (isNaN(parseFloat(parsedDetails.Longitude))) {
        customErrors.push({
          msg: 'Invalid longitude',
          path: 'details.Longitude',
        });
      }
      if (isNaN(parseFloat(parsedDetails.Area)) || parsedDetails.Area < 0) {
        customErrors.push({ msg: 'Invalid area', path: 'details.Area' });
      }
      if (isNaN(parseInt(parsedDetails.Rooms)) || parsedDetails.Rooms < 0) {
        customErrors.push({
          msg: 'Invalid number of rooms',
          path: 'details.Rooms',
        });
      }
      if (isNaN(parseFloat(parsedDetails.Price)) || parsedDetails.Price < 0) {
        customErrors.push({ msg: 'Invalid price', path: 'details.Price' });
      }
      console.log('req.files:', req.files);
      if (!validationErrors.isEmpty() || customErrors.length > 0) {
        if (req.files) {
          const files = req.files as Express.Multer.File[];
          await Promise.all(
            files.map((file) => {
              console.log('File MIME type:', file.mimetype);
              fs.unlink(file.path).catch((err) =>
                logError('Failed to delete file', {
                  error: err,
                  path: file.path,
                })
              );
            })
          );
        }
        return res.status(400).json({
          success: false,
          errors: [...validationErrors.array(), ...customErrors],
        });
      }
      const images: string[] =
        (req.files as Express.Multer.File[] | undefined)?.map(
          (file: Express.Multer.File) => file.path
        ) || [];
      const newHouse = new House({
        agencyId: agencyId,
        details: {
          PropertyType: parsedDetails.PropertyType,
          Price: parseFloat(parsedDetails.Price),
          Area: parseFloat(parsedDetails.Area),
          Rooms: parseInt(parsedDetails.Rooms, 10),
          Latitude: parseFloat(parsedDetails.Latitude),
          Longitude: parseFloat(parsedDetails.Longitude),
        },
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
        region,
      });
      await newHouse.save();
      const cacheKeyList = `houses:${newHouse.agencyId.toString()}`;
      const cachedHouses = await redisClient.get(cacheKeyList);
      if (cachedHouses) {
        const houses = JSON.parse(cachedHouses);
        houses.push(newHouse);
        await redisClient.setEx(
          cacheKeyList,
          CACHE_TTL,
          JSON.stringify(houses)
        );
      } else {
        await redisClient.del(cacheKeyList);
      }
      console.log('AGENCY KEY ID', newHouse.agencyId.toString());
      const cacheKeyHouse = `house:${newHouse.agencyId.toString()}:${
        newHouse.details.ID
      }`;
      await redisClient.setEx(
        cacheKeyHouse,
        CACHE_TTL,
        JSON.stringify(newHouse)
      );

      res.status(201).json({
        success: true,
        data: { house: newHouse },
        message: 'House added successfully',
      });
    } catch (error: any) {
      if (req.files) {
        const files = req.files as Express.Multer.File[];
        await Promise.all(
          files.map((file) =>
            fs.unlink(file.path).catch((err) =>
              logError('Failed to delete file', {
                error: err,
                path: file.path,
              })
            )
          )
        );
      }

      logError('Error adding house', { error, agencyId: req.agencyId });
      if (error.name === 'ValidationError') {
        res.status(400).json({
          success: false,
          message: 'Invalid house data',
          errors: error.errors,
        });
        return;
      }
      if (error.message.includes('Invalid file type')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: 'Failed to add house' });
    }
  },
];

export const deleteHouse = [
  houseRateLimiter,
  requireAgency,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const houseId = req.params.id;

      const house = await House.findById(houseId).lean();
      if (!house) {
        res.status(404).json({ success: false, message: 'House not found' });
        return;
      }

      if (house.agencyId.toString() !== req.agencyId) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized to delete this house',
        });
        return;
      }

      await House.deleteOne({ _id: houseId });

      const cacheKeyList = `houses:${req.agencyId}`;
      const cachedHouses = await redisClient.get(cacheKeyList);
      if (cachedHouses) {
        const houses = JSON.parse(cachedHouses).filter(
          (h: any) => h._id !== houseId
        );
        await redisClient.setEx(
          cacheKeyList,
          CACHE_TTL,
          JSON.stringify(houses)
        );
      } else {
        await redisClient.del(cacheKeyList);
      }

      await redisClient.del(`house:${req.agencyId}:${houseId}`);

      res
        .status(200)
        .json({ success: true, message: 'House deleted successfully' });
    } catch (error: any) {
      logError('Error deleting house', {
        error,
        agencyId: req.agencyId,
        houseId: req.params.id,
      });
      res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  },
];

export const getHousesByAgency = [
  houseRateLimiter,
  requireAgency,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { page = '1', limit = '10' } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const cacheKey = `houses:${req.agencyId}:${pageNum}:${limitNum}`;
      const { data: houses, cached } = await cacheOrQuery(
        cacheKey,
        () =>
          House.find({ agencyId: req.agencyId })
            .select(
              'details.ID details.PropertyType details.Price details.Area details.Rooms details.Latitude details.Longitude titre description images'
            )
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean(),
        CACHE_TTL
      );

      res.status(200).json({ success: true, data: { houses }, cached });
    } catch (error: any) {
      logError('Error fetching houses by agency', {
        error,
        agencyId: req.agencyId,
      });
      res
        .status(500)
        .json({ success: false, message: 'Failed to fetch houses' });
    }
  },
];

export const getHouseById = [
  houseRateLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id: houseId } = req.params;

      const cacheKey = `house:${req.query.agencyId}:${houseId}`;
      const { data: house, cached } = await cacheOrQuery(
        cacheKey,
        async () => {
          const house = await House.findOne({
            'details.ID': parseInt(houseId, 10),
          })
            .select(
              'details.ID details.PropertyType details.Price details.Area details.Rooms details.Latitude details.Longitude titre description images'
            )
            .lean();
          if (!house) {
            throw new Error('House not found');
          }
          // if (house.agencyId.toString() !== req.agencyId) {
          //   throw new Error(' unauthorized access to this house');
          // }
          return house;
        },
        CACHE_TTL
      );

      res.status(200).json({ success: true, data: { house }, cached });
    } catch (error: any) {
      logError('Error retrieving house', {
        error,
        agencyId: req.agencyId,
        houseId: req.params.id,
      });
      console.log(error);
      if (error.message === 'House not found') {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      if (error.message === 'Unauthorized access to this house') {
        res.status(403).json({ success: false, message: error.message });
        return;
      }
      res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  },
];
