import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// Extend Request to include authenticated user info
interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

interface DecodedToken extends JwtPayload {
  _id?: string;
  id?: string;
}

// Middleware to authenticate JWT (from HttpOnly cookie)
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.cookies?.token; // Read token from HttpOnly cookie

  if (!token) {
    res.status(401).json({ error: "Access Denied. No token provided." });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;

    // Accept either _id or id from token
    const userId = decoded._id || decoded.id;

    if (!userId) {
      res.status(400).json({ error: "Invalid token payload: user ID missing." });
      return;
    }

    // Attach user ID to the request object
    req.user = { id: userId };
    next();
  } catch (error: any) {
    console.error("JWT error:", error.message);
    res.status(401).json({ error: "Invalid Token" });
  }
};

export type { AuthRequest };
