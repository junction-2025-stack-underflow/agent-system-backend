import { Request, Response } from "express";
import House from "../models/House";

export const addHouse = async (req: Request, res: Response) => {
  try {
    const {
      type,
      agencyId,
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
