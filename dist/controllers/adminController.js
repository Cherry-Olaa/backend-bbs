"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLogin = adminLogin;
const User_1 = __importDefault(require("../models/User"));
const hash_1 = require("../utils/hash");
const jwt_1 = require("../utils/jwt");
async function adminLogin(req, res) {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ message: "username & password required" });
    const user = await User_1.default.findOne({ username });
    if (!user)
        return res.status(401).json({ message: "Invalid credentials" });
    const ok = await (0, hash_1.comparePassword)(password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ message: "Invalid credentials" });
    if (user.role !== "admin")
        return res.status(403).json({ message: "Not an admin" });
    // ✅ Replace this part
    const payload = {
        id: user._id.toString(),
        role: user.role,
        name: user.fullName,
    };
    const access = (0, jwt_1.signAccess)(payload);
    const refresh = (0, jwt_1.signRefresh)(payload);
    user.refreshToken = refresh;
    await user.save();
    res.json({
        access,
        refresh,
        profile: {
            id: user._id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
        },
    });
}
