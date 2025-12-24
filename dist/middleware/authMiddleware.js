"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Student_1 = __importDefault(require("../models/Student"));
const JWT_SECRET = process.env.JWT_SECRET || "secret";
// Middleware to authenticate users
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader)
            return res.status(401).json({ message: "No token" });
        const token = authHeader.split(" ")[1];
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (!payload)
            return res.status(401).json({ message: "Invalid token" });
        if (payload.role === "staff" || payload.role === "admin") {
            const user = await User_1.default.findById(payload.id).lean();
            if (!user)
                return res.status(401).json({ message: "User not found" });
            req.user = {
                id: user._id.toString(),
                role: user.role,
                fullName: user.fullName,
                assignedClasses: user.assignedClasses || [],
            };
        }
        else if (payload.role === "student") {
            const student = await Student_1.default.findById(payload.id).lean();
            if (!student)
                return res.status(401).json({ message: "Student not found" });
            req.user = {
                id: student._id.toString(),
                role: "student",
                admissionNumber: student.admissionNumber,
            };
        }
        else {
            return res.status(401).json({ message: "Invalid role" });
        }
        next();
    }
    catch (err) {
        return res
            .status(401)
            .json({ message: "Authentication failed", detail: err.message });
    }
};
exports.authenticate = authenticate;
// Middleware to authorize specific roles
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: "Not authenticated" });
        if (!roles.includes(req.user.role))
            return res.status(403).json({ message: "Forbidden" });
        next();
    };
};
exports.authorize = authorize;
