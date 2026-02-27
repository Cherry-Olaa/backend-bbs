// controllers/staffSubjectController.ts
import { Request, Response } from "express";
import ClassSubject from "../models/ClassSubject";
import SubjectRegistration from "../models/SubjectRegistration";
import Student from "../models/Student";

interface AuthRequest extends Request {
    user?: any;
}

// Get subjects available for staff's class
export async function getClassSubjectsForStaff(req: AuthRequest, res: Response) {
    try {
        const staff = req.user;
        const { term, academicYear } = req.query;
        
        if (!staff?.assignedClasses?.length) {
            return res.status(400).json({ msg: "No classes assigned" });
        }
        
        // Get subjects for all assigned classes
        const classSubjects = await ClassSubject.find({
            className: { $in: staff.assignedClasses },
            academicYear: academicYear || new Date().getFullYear().toString(),
            term: term || "First"
        }).populate("subjectId", "name code");
        
        // Group by class
        const grouped = classSubjects.reduce((acc: any, item) => {
            if (!acc[item.className]) {
                acc[item.className] = [];
            }
            acc[item.className].push(item);
            return acc;
        }, {});
        
        res.json({
            subjects: classSubjects,
            grouped
        });
    } catch (error) {
        console.error("Get staff class subjects error:", error);
        res.status(500).json({ msg: "Server error" });
    }
}

// Get students eligible for a subject (only those in the class)
export async function getEligibleStudents(req: AuthRequest, res: Response) {
    try {
        const { className, subjectId, term, academicYear } = req.query;
        
        // First verify this subject is offered in this class
        const classSubject = await ClassSubject.findOne({
            className,
            subjectId,
            academicYear,
            term
        });
        
        if (!classSubject) {
            return res.status(403).json({ 
                msg: "This subject is not offered in this class" 
            });
        }
        
        // Get all students in the class
        const students = await Student.find({
            admissionNumber: { $regex: `^${className}/` }
        }).select("_id firstName lastName admissionNumber");
        
        // Get already registered students
        const registrations = await SubjectRegistration.find({
            class: className,
            subjectId,
            academicYear,
            term,
            isActive: true
        }).select("studentId");
        
        const registeredIds = registrations.map(r => r.studentId.toString());
        
        // Mark which students are already registered
        const studentsWithStatus = students.map(student => ({
            ...student.toObject(),
            isRegistered: registeredIds.includes(student._id.toString())
        }));
        
        res.json({
            students: studentsWithStatus,
            total: students.length,
            registered: registeredIds.length
        });
    } catch (error) {
        console.error("Get eligible students error:", error);
        res.status(500).json({ msg: "Server error" });
    }
}