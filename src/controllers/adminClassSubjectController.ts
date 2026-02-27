// controllers/adminClassSubjectController.ts
import { Request, Response } from "express";
import ClassSubject from "../models/ClassSubject";
import Subject from "../models/Subject";

interface AuthRequest extends Request {
    user?: any;
}

// Get all subjects for a class
export async function getClassSubjects(req: AuthRequest, res: Response) {
    try {
        const { className, academicYear, term } = req.query;
        
        let query: any = {};
        if (className) query.className = className;
        if (academicYear) query.academicYear = academicYear;
        if (term) query.term = term;
        
        const classSubjects = await ClassSubject.find(query)
            .populate("subjectId", "name code")
            .sort({ createdAt: -1 });
        
        res.json({
            classSubjects,
            grouped: {}
        });
    } catch (error) {
        console.error("Get class subjects error:", error);
        res.status(500).json({ msg: "Server error" });
    }
}

// Create a new subject and assign it to a class
export async function createAndAssignSubject(req: AuthRequest, res: Response) {
    try {
        const { className, subjectName, subjectCode, academicYear, term, isCompulsory } = req.body;
        
        if (!className || !subjectName || !subjectCode || !academicYear || !term) {
            return res.status(400).json({ msg: "Missing required fields" });
        }

        // Check if subject already exists
        let subject = await Subject.findOne({ code: subjectCode.toUpperCase() });
        
        if (!subject) {
            // Create new subject
            subject = await Subject.create({
                name: subjectName,
                code: subjectCode.toUpperCase()
            });
        }

        // Check if subject is already assigned to this class/term
        const existingAssignment = await ClassSubject.findOne({
            className,
            subjectId: subject._id,
            academicYear,
            term
        });

        if (existingAssignment) {
            return res.status(400).json({ 
                msg: "This subject is already assigned to this class for the selected term" 
            });
        }

        // Assign subject to class
        const classSubject = await ClassSubject.create({
            className,
            subjectId: subject._id,
            academicYear,
            term,
            isCompulsory: isCompulsory ?? true,
            createdBy: req.user?.id
        });

        // Populate the subject details
        await classSubject.populate("subjectId", "name code");

        res.json({ 
            msg: "Success", 
            data: classSubject,
            message: `Subject ${subjectName} created and assigned to ${className}`
        });

    } catch (error) {
        console.error("Create and assign subject error:", error);
        res.status(500).json({ msg: "Server error" });
    }
}

// Update a subject
export async function updateSubject(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const { name, code } = req.body;

        const subject = await Subject.findByIdAndUpdate(
            id,
            { name, code: code.toUpperCase() },
            { new: true }
        );

        if (!subject) {
            return res.status(404).json({ msg: "Subject not found" });
        }

        res.json({ 
            msg: "Success", 
            data: subject,
            message: "Subject updated successfully" 
        });

    } catch (error) {
        console.error("Update subject error:", error);
        res.status(500).json({ msg: "Server error" });
    }
}

// Delete a subject (and remove all class assignments)
export async function deleteSubject(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;

        // Delete the subject
        const subject = await Subject.findByIdAndDelete(id);
        
        if (!subject) {
            return res.status(404).json({ msg: "Subject not found" });
        }

        // Remove all class assignments for this subject
        await ClassSubject.deleteMany({ subjectId: id });

        res.json({ 
            msg: "Success", 
            message: "Subject deleted and removed from all classes" 
        });

    } catch (error) {
        console.error("Delete subject error:", error);
        res.status(500).json({ msg: "Server error" });
    }
}

// Remove subject from a specific class (but keep the subject)
export async function removeSubjectFromClass(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params; // This is the ClassSubject ID

        const classSubject = await ClassSubject.findByIdAndDelete(id);
        
        if (!classSubject) {
            return res.status(404).json({ msg: "Assignment not found" });
        }

        res.json({ 
            msg: "Success", 
            message: "Subject removed from class" 
        });

    } catch (error) {
        console.error("Remove subject from class error:", error);
        res.status(500).json({ msg: "Server error" });
    }
}

// Copy subjects from previous term
export async function copyClassSubjects(req: AuthRequest, res: Response) {
    try {
        const { fromYear, fromTerm, toYear, toTerm } = req.body;
        
        const subjects = await ClassSubject.find({
            academicYear: fromYear,
            term: fromTerm
        });
        
        if (subjects.length === 0) {
            return res.status(404).json({ msg: "No subjects found for previous term" });
        }
        
        const newSubjects = subjects.map(s => ({
            className: s.className,
            subjectId: s.subjectId,
            academicYear: toYear,
            term: toTerm,
            isCompulsory: s.isCompulsory,
            createdBy: req.user?.id
        }));
        
        const result = await ClassSubject.insertMany(newSubjects);
        
        res.json({ 
            msg: "Success", 
            count: result.length,
            message: `Copied ${result.length} subjects to ${toTerm} ${toYear}`
        });
        
    } catch (error) {
        console.error("Copy class subjects error:", error);
        res.status(500).json({ msg: "Server error" });
    }
}

// Get all subjects (for dropdown/selection)
export async function getAllSubjects(req: AuthRequest, res: Response) {
    try {
        const subjects = await Subject.find().sort({ name: 1 });
        res.json(subjects);
    } catch (error) {
        console.error("Get all subjects error:", error);
        res.status(500).json({ msg: "Server error" });
    }
}