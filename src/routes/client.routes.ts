import express from "express";
import { addClient, deleteClient, getAllClients, getClientById } from "../controllers/client.controller";
import { authenticateAgency } from "../middlewares/auth.middleware"; 


const router = express.Router();
router.post("/", authenticateAgency, addClient);
router.delete("/:id", authenticateAgency, deleteClient);
router.get("/myclients", authenticateAgency, getAllClients);
router.get("/myclient/:id", authenticateAgency, getClientById);

export default router;
