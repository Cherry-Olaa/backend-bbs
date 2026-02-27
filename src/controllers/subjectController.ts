// import { Request, Response } from "express";
// import Subject from "../models/Subject";

// export async function createSubject(req: Request, res: Response) {
//   const { code, name } = req.body;
//   if (!code || !name) return res.status(400).json({ message: "code & name required" });
//   const s = await Subject.create({ code: code.toUpperCase(), name });
//   res.json(s);
// }

// export async function listSubjects(req: Request, res: Response) {
//   const subjects = await Subject.find().lean();
//   res.json(subjects);
// }

// controllers/subjectController.ts
import { Request, Response } from "express";
import Subject from "../models/Subject";

interface AuthRequest extends Request {
    user?: any;
}

// Create a new subject
export async function createSubject(req: AuthRequest, res: Response) {
    try {
        const { name, code } = req.body;
        
        console.log("Creating subject with data:", { name, code }); // Debug log
        
        if (!name || !code) {
            return res.status(400).json({ 
                msg: "Missing required fields. Please provide name and code." 
            });
        }

        // Check if subject already exists
        const existingSubject = await Subject.findOne({ 
            code: code.toUpperCase() 
        });
        
        if (existingSubject) {
            return res.status(400).json({ 
                msg: "Subject with this code already exists" 
            });
        }

        // Create new subject
        const subject = await Subject.create({
            name,
            code: code.toUpperCase()
        });

        res.status(201).json({
            msg: "Success",
            data: subject
        });

    } catch (error) {
        console.error("Create subject error:", error);
        res.status(500).json({ msg: "Server error" });
    }
}

// Get all subjects
export async function getAllSubjects(req: AuthRequest, res: Response) {
    try {
        const subjects = await Subject.find().sort({ name: 1 });
        res.json(subjects);
    } catch (error) {
        console.error("Get all subjects error:", error);
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
            data: subject
        });

    } catch (error) {
        console.error("Update subject error:", error);
        res.status(500).json({ msg: "Server error" });
    }
}

// Delete a subject
export async function deleteSubject(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;

        const subject = await Subject.findByIdAndDelete(id);
        
        if (!subject) {
            return res.status(404).json({ msg: "Subject not found" });
        }

        res.json({
            msg: "Success",
            message: "Subject deleted successfully"
        });

    } catch (error) {
        console.error("Delete subject error:", error);
        res.status(500).json({ msg: "Server error" });
    }
}