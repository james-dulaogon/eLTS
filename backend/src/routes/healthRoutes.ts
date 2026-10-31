import { Router } from "express";
import { getHealth } from "../controllers/healthController";

const healthRoutes = Router();

healthRoutes.get("/", getHealth);

export default healthRoutes;
