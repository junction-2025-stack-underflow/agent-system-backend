import express from "express";
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
router.post("/", authenticateAgency, upload.array("images", 10), addHouse);
router.delete("/:id", authenticateAgency, deleteHouse);
router.get("/myhouses", authenticateAgency, getHousesByAgency);
router.get("/myhouse/:id", authenticateAgency, getHouseById); 
router.get("/:id/recommendations", authenticateAgency, recommendClientsForHouse);


export default router;
