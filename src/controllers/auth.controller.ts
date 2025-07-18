import { Request, Response } from "express";
import Agency from "../models/Agency";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const loginAgency = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      return res.status(500).json({ message: "Internal server error" });
    }

    const agency = await Agency.findOne({ email });
    if (!agency) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, agency.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let token: string;
    try {
      token = jwt.sign({ id: agency._id }, JWT_SECRET, {
        expiresIn: "1d",
      });
    } catch (jwtError) {
      console.error("JWT signing error:", jwtError);
      return res.status(500).json({ message: "Error generating authentication token" });
    }

    res.json({ token, agencyId: agency._id, name: agency.name, email: agency.email });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};
