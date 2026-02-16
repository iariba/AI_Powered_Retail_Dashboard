import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

interface DecodedToken extends JwtPayload {
  _id?: string;
  id?: string;
}


export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.cookies?.token; 

  if (!token) {
    res.status(401).json({ error: "Access Denied. No token provided." });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;


    const userId = decoded._id || decoded.id;

    if (!userId) {
      res.status(400).json({ error: "Invalid token payload: user ID missing." });
      return;
    }


    req.user = { id: userId };
    next();
  } catch (error: any) {
    console.error("JWT error:", error.message);
    res.status(401).json({ error: "Invalid Token" });
  }
};

export type { AuthRequest };
