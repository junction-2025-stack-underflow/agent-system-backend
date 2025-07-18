import express from 'express';
import { addAgency, confirmAgencyEmail, loginAgency } from '../controllers/agency.controller';
const router = express.Router();

router.post('/', addAgency);
router.post("/login", loginAgency);
router.post("/confirm-email", confirmAgencyEmail)

export default router;
