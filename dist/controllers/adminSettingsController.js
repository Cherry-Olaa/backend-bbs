"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAdminSettings = updateAdminSettings;
const User_1 = __importDefault(require("../models/User"));
const hash_1 = require("../utils/hash");
async function updateAdminSettings(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { fullName, username, currentPassword, newPassword, } = req.body;
        if (!currentPassword) {
            return res.status(400).json({ message: "Current password is required" });
        }
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // 🔐 verify current password
        const valid = await (0, hash_1.comparePassword)(currentPassword, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }
        // ✏️ update basic fields
        if (fullName)
            user.fullName = fullName;
        if (username)
            user.username = username;
        // 🔐 update password only if provided
        if (newPassword && newPassword.trim().length > 0) {
            user.passwordHash = await (0, hash_1.hashPassword)(newPassword);
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
    }
    catch (err) {
        console.error("Update Admin Settings Error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}
