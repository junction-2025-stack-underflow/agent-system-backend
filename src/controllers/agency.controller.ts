import { Request, Response } from "express";
import Agency from "../models/Agency";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const addAgency = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password || !phone || !address?.wilaya || !address?.commune) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    const existingAgency = await Agency.findOne({ email });
    if (existingAgency) {
      return res.status(400).json({ message: "Agency with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAgency = new Agency({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
    });

    await newAgency.save();

    res.status(201).json({ message: "Agency created successfully", agencyId: newAgency._id });
  } catch (error) {
    console.error("Error creating agency:", error);
    res.status(500).json({ message: "Server error while creating agency." });
  }
};

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

    const token = jwt.sign({ id: agency._id }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token, agencyId: agency._id, name: agency.name, email: agency.email });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};
