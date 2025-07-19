import { Response } from 'express';
import { AuthRequest } from '../types/express';
import House from '../models/House';
import axios from 'axios';

export const recommendClientsForHouse = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const house = await House.find({ 'details.ID': req.params.id });
    const response = await axios.get(
      `${process.env.AI_SERVICE}/match/${req.params.id}`
    );
    console.log(response.data);
    res.status(200).json({ success: true, data: response.data });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recommendClientsForAllHouses = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const response = await axios.get(`${process.env.AI_SERVICE}/match_all`);
    res.status(200).json({ success: true, data: response.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
