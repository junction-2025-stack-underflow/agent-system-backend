import express from "express";
import {
  addClient,
  deleteClient,
  getAllClients,
  getClientById
} from "../controllers/client.controller";
import { authenticateAgency } from "../middlewares/auth.middleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Client management for agencies
 */

/**
 * @swagger
 * /clients:
 *   post:
 *     summary: Add a new client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientInput'
 *     responses:
 *       201:
 *         description: Client created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post("/", authenticateAgency, addClient);

/**
 * @swagger
 * /clients/{id}:
 *   delete:
 *     summary: Delete a client by ID
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client deleted
 *       404:
 *         description: Client not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", authenticateAgency, deleteClient);

/**
 * @swagger
 * /clients/myclients:
 *   get:
 *     summary: Get all clients for the agency
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of clients
 *       500:
 *         description: Server error
 */
router.get("/myclients", authenticateAgency, getAllClients);

/**
 * @swagger
 * /clients/myclient/{id}:
 *   get:
 *     summary: Get a single client by ID
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client found
 *       404:
 *         description: Client not found
 *       500:
 *         description: Server error
 */
router.get("/myclient/:id", authenticateAgency, getClientById);


export default router;
