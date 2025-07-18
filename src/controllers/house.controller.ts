import { Request, Response } from "express";
import House from "../models/House";
import { AuthRequest } from "../types/express";

export const addHouse = async (req: AuthRequest, res: Response) => {
  try {
    const {
      type,
      location,
      superficie,
      nombreChambre,
      nombreLits,
      nombreSallesDeBain,
      nombreCuisine,
      wifi,
      television,
      laveLinge,
      parking,
      climatisation,
      chauffage,
      titre,
      description,
    } = req.body;
    const images = (req.files as Express.Multer.File[] | undefined)?.map((file) => file.path) || [];
    const agencyId = req.agencyId;
    if (!agencyId) {
      return res.status(401).json({ message: "Unauthorized: Missing agency ID" });
    }
    const newHouse = new House({
      type,
      agencyId,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      superficie,
      nombreChambre,
      nombreLits,
      nombreSallesDeBain,
      nombreCuisine,
      wifi,
      television,
      laveLinge,
      parking,
      climatisation,
      chauffage,
      images,
      titre,
      description,
    });

    await newHouse.save();

    res.status(201).json({ message: "House added successfully", house: newHouse });
  } catch (error) {
    console.error("Error adding house:", error);
    res.status(500).json({ message: "Failed to add house", error });
  }
};
export const deleteHouse = async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.agencyId;
      const houseId = req.params.id;
  
      const house = await House.findById(houseId);
  
      if (!house) {
        return res.status(404).json({ message: "House not found" });
      }
  
      if (house.agencyId.toString() !== agencyId) {
        return res.status(403).json({ message: "Unauthorized to delete this house" });
      }
  
      await House.findByIdAndDelete(houseId);
      res.status(200).json({ message: "House deleted successfully" });
    } catch (error) {
      console.error("Error deleting house:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  export const getHousesByAgency = async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.agencyId;
  
      if (!agencyId) {
        return res.status(401).json({ message: "Unauthorized: Missing agency ID" });
      }
  
      const houses = await House.find({ agencyId });
  
      res.status(200).json({ houses });
    } catch (error) {
      console.error("Error fetching houses by agency:", error);
      res.status(500).json({ message: "Failed to fetch houses", error });
    }
  };
  export const getHouseById = async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.agencyId;
      const houseId = req.params.id;
  
      const house = await House.findById(houseId);
  
      if (!house) {
        return res.status(404).json({ message: "House not found" });
      }
  
      if (house.agencyId.toString() !== agencyId) {
        return res.status(403).json({ message: "Unauthorized access to this house" });
      }
  
      res.status(200).json({ house });
    } catch (error) {
      console.error("Error retrieving house:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };