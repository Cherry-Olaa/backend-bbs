// controllers/adminSettingsController.ts
import { Request, Response } from "express";
import User from "../models/User";
import { comparePassword, hashPassword } from "../utils/hash";
import { AuthRequest } from "../middleware/authMiddleware";

export async function updateAdminSettings(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      fullName,
      username,
      currentPassword,
      newPassword,
    } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔐 verify current password
    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // ✏️ update basic fields
    if (fullName) user.fullName = fullName;
    if (username) user.username = username;

    // 🔐 update password only if provided
    if (newPassword && newPassword.trim().length > 0) {
      user.passwordHash = await hashPassword(newPassword);
    }

    await user.save();

    return res.json({
      message: "Settings updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error("Update Admin Settings Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}