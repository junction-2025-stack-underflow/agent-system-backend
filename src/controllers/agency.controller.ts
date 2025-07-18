import { Request, Response } from 'express';
import Agency from '../models/Agency';
import bcrypt from 'bcryptjs';

export const addAgency = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, address } = req.body;
    console.log(req.body);

    if (!name || !email || !password || !phone || !address?.wilaya || !address?.commune) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    const existingAgency = await Agency.findOne({ email });
    if (existingAgency) {
      return res.status(400).json({ message: 'Agency with this email already exists.' });
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

    res.status(201).json({ message: 'Agency created successfully', agencyId: newAgency._id });
  } catch (error) {
    console.error('Error creating agency:', error);
    res.status(500).json({ message: 'Server error while creating agency.' });
  }
};
