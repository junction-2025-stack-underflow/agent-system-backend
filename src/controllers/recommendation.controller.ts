import { Response } from "express";
import { AuthRequest } from "../types/express";

export const recommendClientsForHouse = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ message: "hello world" });
};
