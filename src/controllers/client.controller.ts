import { Response } from "express";
import Client from "../models/Client";
import { AuthRequest } from "../types/express";

export const addClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const agencyId = req.agencyId;

    const {
      fullName,
      telephone,
      email,
      budget,
      superficie,
      region,
      besoin,
      nombreChambre,
      status,
    } = req.body;
    if (!fullName || !telephone || !budget) {
      res.status(400).json({ message: "fullName, telephone, and budget are required" });
      return;
    }

    const newClient = new Client({
      fullName,
      telephone,
      email,
      budget,
      superficie,
      region,
      besoin,
      nombreChambre,
      status,
      agencyId, 
    });

    await newClient.save();

    res.status(201).json({ message: "Client added successfully", client: newClient });
  } catch (error) {
    console.error("Error adding client:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const deleteClient = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const agencyId = req.agencyId;
      const clientId = req.params.id;
  
      const client = await Client.findOne({ _id: clientId, agencyId });
  
      if (!client) {
        res.status(404).json({ message: "Client not found or unauthorized" });
        return;
      }
  
      await Client.findByIdAndDelete(clientId);
  
      res.status(200).json({ message: "Client deleted successfully" });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };