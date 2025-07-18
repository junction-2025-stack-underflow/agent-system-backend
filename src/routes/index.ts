import { Router, Request, Response } from "express";
import houseRoutes from "./house.routes";
import agencyRoutes from "./agency.routes";
import clientRoutes from "./client.routes";
const router = Router();

router.get("/", (_: Request, res: Response) => {
  res.send("Hello, World!");
});
router.use("/houses", houseRoutes);
router.use("/agency", agencyRoutes);
router.use("/clients", clientRoutes)
export { router as appRouter };
