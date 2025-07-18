import express from "express";
import { addClient, deleteClient } from "../controllers/client.controller";
import { protect } from "../middlewares/auth.middleware"; 


const router = express.Router();
router.post("/", protect, addClient);
router.delete("/:id", protect, deleteClient);

export default router;
