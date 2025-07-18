import { Response } from "express";
import { AuthRequest } from "../types/express";
import House from "../models/House";
import Client from "../models/Client";

export const recommendClientsForHouse = async (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.agencyId?.toString();
    const houseId = req.params.id;

    if (!agencyId) {
      console.log("Missing agencyId from token");
      return res.status(401).json({ message: "Unauthorized: Missing agency ID" });
    }

    console.log("House ID:", houseId);
    console.log("Agency ID:", agencyId);

    const house = await House.findById(houseId);

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    if (house.agencyId.toString() !== agencyId) {
      return res.status(403).json({ message: "Unauthorized access to this house" });
    }

    const { price, region, superficie, nombreChambre } = house;

    const matchingClients = await Client.find({
      agencyId,
      budget: { $gte: price },
      region,
      superficie: { $gte: superficie || 0 },
      nombreChambre: { $gte: nombreChambre || 0 },
    })
      .sort({ budget: 1 })
      .limit(10);

    return res.status(200).json({ clients: matchingClients });
  } catch (error) {
    console.error("Error recommending clients:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
