import express from "express";
import { register, login, protectedRoute, logout, getUsername } from "../controllers/authController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/dashboard", authenticateToken, protectedRoute);
router.get("/logout", authenticateToken, logout);
router.get("/username", getUsername);
export default router;
