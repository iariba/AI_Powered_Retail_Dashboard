import { Request, Response } from "express";
import User, { IUser } from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Register Controller
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      res.status(400).json({ error: "Email already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

//  Login Controller
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    console.log("Password in request:", password);
    console.log("Hashed password in DB:", user.password);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    //  Set JWT as HttpOnly cookie
  
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", 
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", 
        maxAge: 24 * 60 * 60 * 1000,
      });
      

    res.json({
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

export const protectedRoute = (req: Request, res: Response): void => {
  res.json({
    message: "Welcome to the protected route!",
    userId: (req as any).user.userId,
  });
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ error: "Server error during logout." });
  }
};

export const getUsername = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.token; 
    if (!token) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { _id: string };
    const user = await User.findById(decoded._id).select("name");

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ name: user.name });
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};
