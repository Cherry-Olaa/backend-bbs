"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaffProfile = getStaffProfile;
exports.updateStaffProfile = updateStaffProfile;
const User_1 = __importDefault(require("../models/User"));
const hash_1 = require("../utils/hash");
async function getStaffProfile(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authenticated" });
        const user = await User_1.default.findById(req.user.id).select("_id fullName username role");
        if (!user)
            return res.status(404).json({ message: "Staff not found" });
        return res.json(user);
    }
    catch (err) {
        console.error("Get Staff Profile Error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}
async function updateStaffProfile(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authenticated" });
        const { fullName, username, currentPassword, newPassword } = req.body;
        if (!currentPassword)
            return res.status(400).json({ message: "Current password is required" });
        const user = await User_1.default.findById(req.user.id);
        if (!user)
            return res.status(404).json({ message: "Staff not found" }); // verify current password
        const valid = await (0, hash_1.comparePassword)(currentPassword, user.passwordHash);
        if (!valid)
            return res.status(401).json({ message: "Current password is incorrect" }); // update fields
        if (fullName)
            user.fullName = fullName;
        if (username)
            user.username = username;
        if (newPassword && newPassword.trim().length > 0) {
            user.passwordHash = await (0, hash_1.hashPassword)(newPassword);
        }
        await user.save();
        return res.json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                role: user.role,
            },
        });
    }
    catch (err) {
        console.error("Update Staff Profile Error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}
