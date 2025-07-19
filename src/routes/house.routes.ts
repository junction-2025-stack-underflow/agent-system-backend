import express from 'express';
import {
  addHouse,
  deleteHouse,
  getHousesByAgency,
  getHouseById,
} from '../controllers/house.controller';
import { upload } from '../middlewares/image.upload';
import { authenticateAgency } from '../middlewares/auth.middleware';
import { recommendClientsForAllHouses, recommendClientsForHouse } from '../controllers/recommendation.controller';
const router = express.Router();
router.post('/', upload.array('images', 10), addHouse);
router.delete('/:id', deleteHouse);
router.get('/myhouses', getHousesByAgency);
router.get('/myhouse/:id', getHouseById);
router.get("/recommendations", recommendClientsForAllHouses)
router.get('/:id/recommendations', recommendClientsForHouse);

export default router;
