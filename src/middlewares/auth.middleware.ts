import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtPayload {
  id: string;
}

declare global {
  namespace Express {
    interface Request {
      agencyId?: string;
    }
  }
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    if (!JWT_SECRET) throw new Error("Missing JWT secret");
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    req.agencyId = decoded.id; // ✅ safer than modifying req.body
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};
