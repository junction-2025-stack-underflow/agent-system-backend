import express from 'express';
import { addAgency } from '../controllers/agency.controller';
import { loginAgency } from '../controllers/agency.controller';
const router = express.Router();

router.post('/', addAgency);
router.post("/login", loginAgency);

export default router;
