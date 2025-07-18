import express from 'express';
import { addAgency } from '../controllers/agency.controller';

const router = express.Router();

router.post('/', addAgency);

export default router;
