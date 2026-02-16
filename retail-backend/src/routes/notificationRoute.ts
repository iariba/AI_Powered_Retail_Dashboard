import express, { Request, Response } from "express";
import Notification from "../models/Notification";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();


interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

router.get("/", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized access." });
    }

    const notifications = await Notification.find({
      userId: req.user.id,
      read: false,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
});

export default router;
