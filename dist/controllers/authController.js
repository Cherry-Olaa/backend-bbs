"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.refreshToken = refreshToken;
exports.logout = logout;
const User_1 = __importDefault(require("../models/User"));
const Student_1 = __importDefault(require("../models/Student"));
const hash_1 = require("../utils/hash");
const jwt_1 = require("../utils/jwt");
/**
 * Student + Staff/Admin Login
 */
async function login(req, res) {
    const { admissionNumber, username, password } = req.body; // -------------------- STUDENT LOGIN --------------------
    if (admissionNumber) {
        const student = (await Student_1.default.findOne({
            admissionNumber,
        }));
        if (!student)
            return res.status(401).json({ message: "Invalid credentials" });
        const valid = await (0, hash_1.comparePassword)(password, student.passwordHash);
        if (!valid)
            return res.status(401).json({ message: "Invalid credentials" });
        const payload = {
            id: student._id.toString(),
            role: "student",
            name: student.firstName,
        };
        const token = (0, jwt_1.signAccess)(payload);
        const refresh = (0, jwt_1.signRefresh)(payload);
        student.refreshToken = refresh;
        await student.save();
        return res.json({
            token,
            refresh,
            role: "student",
            id: student._id,
            name: student.firstName,
        });
    } // -------------------- STAFF / ADMIN LOGIN --------------------
    if (!username) {
        return res
            .status(400)
            .json({ message: "Missing username or admissionNumber" });
    }
    const user = (await User_1.default.findOne({ username }));
    if (!user)
        return res.status(401).json({ message: "Invalid credentials" });
    const ok = await (0, hash_1.comparePassword)(password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ message: "Invalid credentials" });
    const payload = {
        id: user._id.toString(),
        role: user.role,
        name: user.fullName,
    };
    const token = (0, jwt_1.signAccess)(payload);
    const refresh = (0, jwt_1.signRefresh)(payload);
    user.refreshToken = refresh;
    await user.save();
    return res.json({
        token,
        refresh,
        role: user.role,
        id: user._id,
        name: user.fullName,
        username: user.username,
    });
}
/**
 * Refresh Token
 */
async function refreshToken(req, res) {
    const { token } = req.body;
    if (!token)
        return res.status(400).json({ message: "Missing token" });
    try {
        const payload = (0, jwt_1.verifyRefresh)(token);
        if (payload.role === "student") {
            const student = (await Student_1.default.findById(payload.id));
            if (!student || student.refreshToken !== token)
                return res.status(401).json({ message: "Invalid token" });
            const newPayload = {
                id: student._id.toString(),
                role: "student",
                name: student.firstName,
            };
            const access = (0, jwt_1.signAccess)(newPayload);
            const refresh = (0, jwt_1.signRefresh)(newPayload);
            student.refreshToken = refresh;
            await student.save();
            return res.json({ access, refresh });
        }
        const user = (await User_1.default.findById(payload.id));
        if (!user || user.refreshToken !== token)
            return res.status(401).json({ message: "Invalid token" });
        const newPayload = {
            id: user._id.toString(),
            role: user.role,
            name: user.fullName,
        };
        const access = (0, jwt_1.signAccess)(newPayload);
        const refresh = (0, jwt_1.signRefresh)(newPayload);
        user.refreshToken = refresh;
        await user.save();
        return res.json({ access, refresh });
    }
    catch (err) {
        return res
            .status(401)
            .json({ message: "Invalid refresh token", detail: err.message });
    }
}
/**
 * Logout
 */
async function logout(req, res) {
    const { token } = req.body;
    if (!token)
        return res.status(400).json({ message: "Missing token" });
    try {
        const payload = (0, jwt_1.verifyRefresh)(token);
        if (payload.role === "student") {
            await Student_1.default.findByIdAndUpdate(payload.id, { refreshToken: null });
        }
        else {
            await User_1.default.findByIdAndUpdate(payload.id, { refreshToken: null });
        }
        return res.json({ message: "Logged out" });
    }
    catch (err) {
        return res.status(400).json({ message: "Invalid token" });
    }
}
