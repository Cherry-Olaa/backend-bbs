import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import StudentModel from "../models/Student";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export interface UserPayload {
  id: string;
  role: "admin" | "staff" | "student";
  fullName?: string;
  admissionNumber?: string;
  assignedClasses?: string[];
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

// Middleware to authenticate users
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token" });
    
    const token = authHeader.split(" ")[1];
    const payload: any = jwt.verify(token, JWT_SECRET);
    if (!payload) return res.status(401).json({ message: "Invalid token" });

    if (payload.role === "staff" || payload.role === "admin") {
      const user = await User.findById(payload.id).lean();
      if (!user) return res.status(401).json({ message: "User not found" });

      req.user = {
        id: user._id.toString(),
        role: user.role as "admin" | "staff",
        fullName: user.fullName,
        assignedClasses: user.assignedClasses || [],
      };
    } else if (payload.role === "student") {
      const student = await StudentModel.findById(payload.id).lean();
      if (!student) return res.status(401).json({ message: "Student not found" });

      // ✅ Check if student is active
      if (student.isActive === false) {
        return res.status(403).json({ 
          message: "Account deactivated. Please contact administration." 
        });
      }

      req.user = {
        id: student._id.toString(),
        role: "student",
        admissionNumber: student.admissionNumber,
      };
    } else {
      return res.status(401).json({ message: "Invalid role" });
    }
    
    next();
  } catch (err: any) {
    return res
      .status(401)
      .json({ message: "Authentication failed", detail: err.message });
  }
};

// Middleware to authorize specific roles
export const authorize = (roles: Array<"admin" | "staff" | "student">) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ message: "Forbidden" });
    next();
  };
};