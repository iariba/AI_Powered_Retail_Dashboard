import express from "express";
import { getUserReports, deleteUserReport } from "../controllers/reportController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/get", authenticateToken, getUserReports);
router.delete("/delete", authenticateToken, deleteUserReport);

export default router;
