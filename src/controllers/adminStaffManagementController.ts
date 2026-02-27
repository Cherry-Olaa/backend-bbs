// controllers/adminStaffManagementController.ts
import { Response } from "express";
import User from "../models/User";
import { hashPassword } from "../utils/hash";
import { AuthRequest } from "../middleware/authMiddleware";

// Get all staff members
export async function getAllStaff(req: AuthRequest, res: Response) {
  try {
    const staff = await User.find({ role: "staff" })
      .select("_id fullName username role assignedClasses createdAt")
      .sort({ createdAt: -1 });
    
    return res.json(staff);
  } catch (err: any) {
    console.error("Get all staff error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Reset staff password (admin only)
export async function resetStaffPassword(req: AuthRequest, res: Response) {
  try {
    const { staffId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters long" 
      });
    }

    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    if (staff.role !== "staff") {
      return res.status(400).json({ message: "User is not a staff member" });
    }

    // Hash and set new password
    staff.passwordHash = await hashPassword(newPassword);
    await staff.save();

    return res.json({
      message: "Password reset successfully",
      staff: {
        id: staff._id,
        fullName: staff.fullName,
        username: staff.username
      }
    });
  } catch (err: any) {
    console.error("Reset staff password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Update staff details (admin only)
export async function updateStaffDetails(req: AuthRequest, res: Response) {
  try {
    const { staffId } = req.params;
    const { fullName, username, assignedClasses } = req.body;

    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    if (staff.role !== "staff") {
      return res.status(400).json({ message: "User is not a staff member" });
    }

    if (fullName) staff.fullName = fullName;
    if (username) staff.username = username;
    if (assignedClasses) staff.assignedClasses = assignedClasses;

    await staff.save();

    return res.json({
      message: "Staff details updated successfully",
      staff: {
        id: staff._id,
        fullName: staff.fullName,
        username: staff.username,
        role: staff.role,
        assignedClasses: staff.assignedClasses
      }
    });
  } catch (err: any) {
    console.error("Update staff details error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}