import express from "express";
import { addHouse } from "../controllers/house.controller";
import { upload } from "../middlewares/image.upload";

const router = express.Router();
router.post("/", upload.array("images", 10), addHouse);

export default router;
