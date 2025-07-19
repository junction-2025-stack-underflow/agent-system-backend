import express from 'express';
import {
  addAgency,
  confirmAgencyEmail,
  loginAgency
} from '../controllers/agency.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Agency
 *   description: Endpoints for agency registration and authentication
 */

/**
 * @swagger
 * /agencies:
 *   post:
 *     summary: Register a new agency
 *     tags: [Agency]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AgencyInput'
 *     responses:
 *       201:
 *         description: Agency registered
 *       400:
 *         description: Invalid input
 */
router.post('/', addAgency);

/**
 * @swagger
 * /agencies/login:
 *   post:
 *     summary: Login an agency
 *     tags: [Agency]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AgencyLogin'
 *     responses:
 *       200:
 *         description: Authenticated successfully
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", loginAgency);

/**
 * @swagger
 * /agencies/confirm-email:
 *   post:
 *     summary: Confirm agency email using code
 *     tags: [Agency]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailConfirmation'
 *     responses:
 *       200:
 *         description: Email confirmed
 *       400:
 *         description: Invalid confirmation data
 */
router.post("/confirm-email", confirmAgencyEmail);

export default router;
