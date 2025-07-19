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
import multer from 'multer';
const router = express.Router();
router.post(
  '/',
  upload.array('images', 10),
  (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res
        .status(400)
        .json({ success: false, message: `Multer error: ${err.message}` });
    } else if (err) {
      console.error('Upload error:', err);
      return res
        .status(400)
        .json({ success: false, message: `Upload error: ${err.message}` });
    }
    next();
  },
  addHouse
);
router.delete('/:id', deleteHouse);
router.get('/myhouses', getHousesByAgency);
router.get('/myhouse/:id', getHouseById);
router.get("/recommendations", recommendClientsForAllHouses)
router.get('/:id/recommendations', recommendClientsForHouse);

export default router;
