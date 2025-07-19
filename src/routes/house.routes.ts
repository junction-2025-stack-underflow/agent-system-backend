import express from 'express';
import {
  addHouse,
  deleteHouse,
  getHousesByAgency,
  getHouseById,
} from "../controllers/house.controller";
import { upload } from "../middlewares/image.upload";
import { authenticateAgency } from "../middlewares/auth.middleware";
import { recommendClientsForHouse } from "../controllers/recommendation.controller";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Houses
 *   description: House management for agencies
 */

/**
 * @swagger
 * /houses:
 *   post:
 *     summary: Add a new house
 *     tags: [Houses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               titre:
 *                 type: string
 *               description:
 *                 type: string
 *               region:
 *                 type: string
 *               nombreLits:
 *                 type: integer
 *               nombreSallesDeBain:
 *                 type: integer
 *               nombreCuisine:
 *                 type: integer
 *               wifi:
 *                 type: boolean
 *               television:
 *                 type: boolean
 *               laveLinge:
 *                 type: boolean
 *               parking:
 *                 type: boolean
 *               climatisation:
 *                 type: boolean
 *               chauffage:
 *                 type: boolean
 *               details:
 *                 type: string
 *                 description: JSON string with PropertyType, Latitude, Longitude, Area, Rooms, Price
 *     responses:
 *       201:
 *         description: House created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post("/", authenticateAgency, upload.array("images", 10), addHouse);

/**
 * @swagger
 * /houses/{id}:
 *   delete:
 *     summary: Delete a house by ID
 *     tags: [Houses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the house
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: House deleted successfully
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: House not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", authenticateAgency, deleteHouse);

/**
 * @swagger
 * /houses/myhouses:
 *   get:
 *     summary: Get houses belonging to the authenticated agency
 *     tags: [Houses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of houses
 *       500:
 *         description: Server error
 */
router.get("/myhouses", authenticateAgency, getHousesByAgency);

/**
 * @swagger
 * /houses/myhouse/{id}:
 *   get:
 *     summary: Get a single house by its internal ID
 *     tags: [Houses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the house (details.ID field)
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: House details
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: House not found
 *       500:
 *         description: Server error
 */
router.get("/myhouse/:id", authenticateAgency, getHouseById);

/**
 * @swagger
 * /houses/{id}/recommendations:
 *   get:
 *     summary: Recommend clients for a house
 *     tags: [Houses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the house
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of recommended clients
 *       500:
 *         description: Server error
 */
router.get("/:id/recommendations", authenticateAgency, recommendClientsForHouse);

export default router;
