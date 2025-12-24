"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDashboardStats = getAdminDashboardStats;
const Student_1 = __importDefault(require("../models/Student"));
const Result_1 = __importDefault(require("../models/Result"));
const User_1 = __importDefault(require("../models/User"));
async function getAdminDashboardStats(req, res) {
    try {
        // 📌 students count
        const students = await Student_1.default.countDocuments();
        // 📌 staff count
        const staff = await User_1.default.countDocuments({ role: "staff" });
        // 📌 today range
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        // 📌 results uploaded today
        const resultsToday = await Result_1.default.countDocuments({
            createdAt: { $gte: start, $lte: end },
        });
        // 📌 recent students
        const recentStudents = await Student_1.default.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select("firstName lastName admissionNumber");
        return res.json({
            students,
            staff,
            resultsToday,
            recentStudents,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ msg: "Dashboard stats error" });
    }
}
