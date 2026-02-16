import express from "express";
import { connectInventorySheet, disconnectInventorySheet, getInventoryInsights, handleSheetWebhook, 
    updateProductStock, getConnectedInventorySheet} from "../controllers/inventoryController";
import { authenticateToken } from "../middleware/authMiddleware";
import { sendUpdates } from "../utils/inventory";
const router = express.Router();

// POST /api/inventory/connect
router.post("/connect", authenticateToken, connectInventorySheet);
router.post("/update-stock", authenticateToken, updateProductStock);
router.get("/disconnect", authenticateToken, disconnectInventorySheet);
router.get("/insights", authenticateToken, getInventoryInsights);
router.post("/sheet-change-webhook", handleSheetWebhook);
router.get("/string", authenticateToken, getConnectedInventorySheet);
router.get("/updates", authenticateToken, sendUpdates)
export default router;
