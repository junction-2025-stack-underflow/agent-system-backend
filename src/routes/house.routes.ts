import express from "express";
import { addHouse, deleteHouse, getHousesByAgency } from "../controllers/house.controller";
import { upload } from "../middlewares/image.upload";
import { protect } from "../middlewares/auth.middleware"; 

const router = express.Router();
router.post("/", protect, upload.array("images", 10), addHouse);
router.delete("/:id", protect, deleteHouse);
router.get("/myhouses", protect, getHousesByAgency);
router.get("/myhouse/:id", protect, getHousesByAgency)
export default router;
