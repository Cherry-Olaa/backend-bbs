// controllers/adminStudentController.ts
import { Request, Response } from "express";
import Student from "../models/Student";

interface AuthRequest extends Request {
    user?: any;
}

// Get all students for admin
export async function getAllStudents(req: AuthRequest, res: Response) {
    try {
        const students = await Student.find()
            .select("firstName lastName admissionNumber session")
            .sort({ admissionNumber: 1 });
        
        res.json(students);
    } catch (error) {
        console.error("Get all students error:", error);
        res.status(500).json({ msg: "Server error" });
    }
}

// Get students by class
export async function getStudentsByClass(req: AuthRequest, res: Response) {
    try {
        const { className } = req.params;
        
        const students = await Student.find({
            admissionNumber: { $regex: `^${className}/` }
        }).select("firstName lastName admissionNumber session");
        
        res.json(students);
    } catch (error) {
        console.error("Get students by class error:", error);
        res.status(500).json({ msg: "Server error" });
    }
}

// Get unique classes
export async function getUniqueClasses(req: AuthRequest, res: Response) {
    try {
        const students = await Student.find().select("admissionNumber");
        
        const classes = new Set(
            students.map(s => s.admissionNumber.split('/').slice(0, 2).join('/'))
        );
        
        res.json(Array.from(classes).sort());
    } catch (error) {
        console.error("Get unique classes error:", error);
        res.status(500).json({ msg: "Server error" });
    }
}