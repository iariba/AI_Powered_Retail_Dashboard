import express from "express";
import { generateForecastReport} from "../controllers/forecastController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();
router.post("/", authenticateToken, generateForecastReport);

export default router;
