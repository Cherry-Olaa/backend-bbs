import { Request, Response } from "express";
import Student from "../models/Student";
import Result from "../models/Result";
import User from "../models/User";

export async function getAdminDashboardStats(req: Request, res: Response) {
  try {
    // 📌 students count
    const students = await Student.countDocuments();

    // 📌 staff count
    const staff = await User.countDocuments({ role: "staff" });

    // 📌 today range
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // 📌 results uploaded today
    const resultsToday = await Result.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });

    // 📌 recent students
    const recentStudents = await Student.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("firstName lastName admissionNumber");

    return res.json({
      students,
      staff,
      resultsToday,
      recentStudents,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Dashboard stats error" });
  }
}