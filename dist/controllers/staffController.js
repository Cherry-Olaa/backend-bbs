"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaffStudents = getStaffStudents;
exports.getStaffDashboardStats = getStaffDashboardStats;
const Student_1 = __importDefault(require("../models/Student"));
const Result_1 = __importDefault(require("../models/Result"));
// -------------------------------
// List students assigned to staff
// -------------------------------
async function getStaffStudents(req, res) {
    try {
        const staff = req.user;
        if (!staff || !Array.isArray(staff.assignedClasses)) {
            return res.status(400).json({ message: "No classes assigned to staff" });
        }
        // Build regex from admission prefixes (e.g. 25/BBS)
        const admissionFilters = staff.assignedClasses.map((prefix) => new RegExp(`^${prefix}`));
        const students = await Student_1.default.find({
            admissionNumber: { $in: admissionFilters },
        })
            .select("_id firstName lastName admissionNumber")
            .lean();
        return res.json(students);
    }
    catch (err) {
        console.error("Get Staff Students Error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}
// ------------------------------------
// Staff Dashboard Statistics
// ------------------------------------
async function getStaffDashboardStats(req, res) {
    try {
        const staff = req.user;
        if (!staff || !Array.isArray(staff.assignedClasses)) {
            return res.status(400).json({ message: "No classes assigned to staff" });
        }
        // Admission number prefixes ONLY
        const admissionFilters = staff.assignedClasses.map((prefix) => new RegExp(`^${prefix}`));
        // 1️⃣ Students under this staff
        const students = await Student_1.default.find({
            admissionNumber: { $in: admissionFilters },
        })
            .select("_id firstName lastName admissionNumber")
            .lean();
        const studentIds = students.map((s) => s._id);
        // 2️⃣ Results uploaded today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const resultsToday = await Result_1.default.countDocuments({
            studentId: { $in: studentIds },
            createdAt: { $gte: today },
        });
        // 3️⃣ Recent results (last 5)
        const recentResultsRaw = await Result_1.default.find({
            studentId: { $in: studentIds },
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("studentId", "firstName lastName admissionNumber")
            .lean();
        const recentResults = recentResultsRaw.map((r) => ({
            _id: r._id.toString(), // result id
            studentId: r.studentId._id.toString(), // ✅ ADD THIS
            studentName: `${r.studentId.firstName} ${r.studentId.lastName || ""}`.trim(),
            admissionNumber: r.studentId.admissionNumber,
            session: r.session,
            term: r.term,
        }));
        // const recentResults = recentResultsRaw.map((r) => ({
        //   _id: r._id.toString(),
        //   studentName: `${r.studentId.firstName} ${
        //     r.studentId.lastName || ""
        //   }`.trim(),
        //   admissionNumber: r.studentId.admissionNumber,
        //   session: r.session,
        //   term: r.term,
        // }));
        return res.json({
            myStudents: students.length,
            resultsToday,
            recentResults,
        });
    }
    catch (err) {
        console.error("Staff Dashboard Stats Error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}
// import { Types } from "mongoose";
// import { Request, Response } from "express";
// import User from "../models/User";
// import Student from "../models/Student";
// import Result from "../models/Result";
// import { AuthRequest } from "../middleware/authMiddleware";
// import mongoose from "mongoose";
// // -----------------------
// // Types
// // -----------------------
// interface PopulatedStudent {
//   _id: string;
//   firstName: string;
//   lastName?: string;
//   admissionNumber: string;
// }
// interface PopulatedResult {
//   _id: string;
//   studentId: PopulatedStudent;
//   session: string;
//   term: string;
//   createdAt: Date;
// }
// interface RecentResult {
//   _id: string;
//   studentName: string;
//   admissionNumber: string;
//   session: string;
//   term: string;
// }
// interface StaffDashboardStats {
//   myStudents: number;
//   resultsToday: number;
//   recentResults: RecentResult[];
// }
// // -------------------------------
// // List students assigned to staff
// // -------------------------------
// export async function getStaffStudents(req: AuthRequest, res: Response) {
//   try {
//     const staff = req.user;
//     if (!staff?.assignedClasses?.length) {
//       return res.status(400).json({ msg: "No classes assigned to staff" });
//     }
//     // build regex from assignedClasses
//     const admissionFilters = staff.assignedClasses.map(
//       (prefix) => new RegExp(`^${prefix}/`)
//     );
//     const students = await Student.find({
//       admissionNumber: { $in: admissionFilters },
//     })
//       .select("_id firstName lastName admissionNumber")
//       .lean();
//     return res.json(students);
//   } catch (err) {
//     console.error("Get Staff Students Error:", err);
//     return res.status(500).json({ msg: "Server error" });
//   }
// }
// export async function getStaffDashboardStats(req: AuthRequest, res: Response) {
//   try {
//     const staff = req.user;
//     if (!staff?.assignedClasses?.length) {
//       return res.status(400).json({ message: "No classes assigned to staff" });
//     }
//     const admissionFilters = staff.assignedClasses.map(
//       (prefix) => new RegExp(`^${prefix}/`)
//     );
//     // 1️⃣ students under staff
//     const students = await Student.find({
//       admissionNumber: { $in: admissionFilters },
//     }).lean();
//     const studentIds = students.map((s) => s._id);
//     // 2️⃣ results today
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const resultsToday = await Result.countDocuments({
//       studentId: { $in: studentIds },
//       createdAt: { $gte: today },
//     });
//     // 3️⃣ recent results
//     const recentResultsRaw = await Result.find({
//         studentId: { $in: studentIds },
//       })
//         .sort({ createdAt: -1 })
//         .limit(5)
//         .populate("studentId", "firstName lastName admissionNumber")
//         .lean<PopulatedResult[]>();
//     const recentResults = recentResultsRaw.map((r) => ({
//       _id: r._id.toString(),
//       studentName: `${r.studentId.firstName} ${
//         r.studentId.lastName || ""
//       }`.trim(),
//       admissionNumber: r.studentId.admissionNumber,
//       session: r.session,
//       term: r.term,
//     }));
//     return res.json({
//       myStudents: students.length,
//       resultsToday,
//       recentResults,
//     });
//   } catch (err) {
//     console.error("Staff Dashboard Stats Error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// }
