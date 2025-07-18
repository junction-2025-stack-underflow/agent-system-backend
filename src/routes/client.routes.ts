import express from "express";
import { addClient, deleteClient, getAllClients, getClientById } from "../controllers/client.controller";
import { protect } from "../middlewares/auth.middleware"; 


const router = express.Router();
router.post("/", protect, addClient);
router.delete("/:id", protect, deleteClient);
router.get("/myclients", protect, getAllClients);
router.get("/myclient/:id", protect, getClientById);

export default router;
