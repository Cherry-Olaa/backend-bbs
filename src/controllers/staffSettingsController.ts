// controllers/staffSettingsController.ts
import { Response } from "express";
import User from "../models/User";
import { comparePassword, hashPassword } from "../utils/hash";
import { AuthRequest } from "../middleware/authMiddleware";

export async function getStaffProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });

    // ✅ FIX: Include assignedClasses in the selection
    const user = await User.findById(req.user.id).select(
      "_id fullName username role assignedClasses" // Added assignedClasses
    );
    
    if (!user) return res.status(404).json({ message: "Staff not found" });

    // ✅ Return the user object with all fields
    return res.json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      assignedClasses: user.assignedClasses || [] // Ensure it's always an array
    });
  } catch (err: any) {
    console.error("Get Staff Profile Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateStaffProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });

    const { fullName, username, currentPassword, newPassword } = req.body;
    if (!currentPassword)
      return res.status(400).json({ message: "Current password is required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Staff not found" });

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid)
      return res.status(401).json({ message: "Current password is incorrect" });

    if (fullName) user.fullName = fullName;
    if (username) user.username = username;

    if (newPassword && newPassword.trim().length > 0) {
      user.passwordHash = await hashPassword(newPassword);
    }

    await user.save();

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        assignedClasses: user.assignedClasses || []
      },
    });
  } catch (err: any) {
    console.error("Update Staff Profile Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}