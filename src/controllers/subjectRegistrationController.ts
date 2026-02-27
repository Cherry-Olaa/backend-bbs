// controllers/subjectRegistrationController.ts
import { Request, Response } from "express";
import SubjectRegistration from "../models/SubjectRegistration";
import ClassSubject from "../models/ClassSubject";
import Student from "../models/Student";
import { IUser } from "../types";

interface AuthRequest extends Request {
    user?: IUser;
}

interface BulkRegistrationBody {
    class: string;
    subjectId: string;
    term: 'First' | 'Second' | 'Third';
    academicYear: string;
    studentIds: string[];
}

interface CopyRegistrationBody {
    fromYear: string;
    fromTerm: 'First' | 'Second' | 'Third';
    toYear: string;
    toTerm: 'First' | 'Second' | 'Third';
    class: string;
}

// ✅ NEW: Check if subject is offered in this class
async function validateSubjectOffered(className: string, subjectId: string, term: string, academicYear: string): Promise<boolean> {
    const classSubject = await ClassSubject.findOne({
        className,
        subjectId,
        term,
        academicYear
    });
    
    return !!classSubject;
}
// Bulk register students for a subject
export async function bulkRegisterSubjects(
    req: AuthRequest, 
    res: Response
): Promise<Response> {
    try {
        const { class: className, subjectId, term, academicYear, studentIds } = req.body as BulkRegistrationBody;
        const staff = req.user;

        if (!staff) {
            return res.status(401).json({ msg: "Unauthorized" });
        }

        // Validate required fields
        if (!className || !subjectId || !term || !academicYear || !studentIds?.length) {
            return res.status(400).json({ 
                msg: "Missing required fields. Please provide class, subject, term, academic year, and students." 
            });
        }

        // Check if subject is offered in this class
        const isSubjectOffered = await validateSubjectOffered(className, subjectId, term, academicYear);
        if (!isSubjectOffered) {
            return res.status(403).json({ 
                msg: "This subject is not offered in this class for the selected term. Please contact admin." 
            });
        }

        // Verify all students belong to this class
        const students = await Student.find({
            _id: { $in: studentIds },
            admissionNumber: { $regex: `^${className}/` }
        });

        if (students.length !== studentIds.length) {
            return res.status(400).json({ 
                msg: "Some students don't belong to this class. Please verify your selection." 
            });
        }

        // Prepare operations array with proper typing
        const operations: any[] = [];

        // Add delete operation for students not in the list
        operations.push({
            deleteMany: {
                filter: {
                    subjectId,
                    academicYear,
                    term,
                    class: className,
                    studentId: { $nin: studentIds }
                }
            }
        });

        // Add upsert operations for selected students
        studentIds.forEach(studentId => {
            operations.push({
                updateOne: {
                    filter: {
                        studentId,
                        subjectId,
                        academicYear,
                        term
                    },
                    update: {
                        $set: {
                            studentId,
                            subjectId,
                            academicYear,
                            term,
                            class: className,
                            isActive: true,
                            registeredBy: staff.id,
                            registeredAt: new Date()
                        }
                    },
                    upsert: true
                }
            });
        });

        // Execute bulk write if there are operations
        if (operations.length > 0) {
            await SubjectRegistration.bulkWrite(operations);
        }

        return res.json({
            msg: "Success",
            count: studentIds.length,
            message: `Successfully registered ${studentIds.length} students`
        });

    } catch (error: any) {
        console.error("Bulk registration error:", error);
        
        // Check for duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ 
                msg: "Some students are already registered for this subject this term." 
            });
        }
        
        return res.status(500).json({ msg: "Server error during registration" });
    }
}
// Get registered students for a subject
export async function getRegisteredStudents(
    req: AuthRequest, 
    res: Response
): Promise<Response> {
    try {
        const { class: className, subjectId, term, academicYear } = req.query as {
            class: string;
            subjectId: string;
            term: 'First' | 'Second' | 'Third';
            academicYear: string;
        };

        if (!className || !subjectId || !term || !academicYear) {
            return res.status(400).json({ 
                msg: "Missing required query parameters" 
            });
        }

        // ✅ NEW: Only return registrations for subjects that are offered
        const isSubjectOffered = await validateSubjectOffered(className, subjectId, term, academicYear);
        if (!isSubjectOffered) {
            return res.json([]); // Return empty if subject not offered
        }

        const registrations = await SubjectRegistration.find({
            class: className,
            subjectId,
            term,
            academicYear,
            isActive: true
        }).populate("studentId", "firstName lastName admissionNumber session");

        return res.json(registrations);

    } catch (error) {
        console.error("Get registered students error:", error);
        return res.status(500).json({ msg: "Server error" });
    }
}

// Get students NOT registered for a subject
export async function getUnregisteredStudents(
    req: AuthRequest, 
    res: Response
): Promise<Response> {
    try {
        const { class: className, subjectId, term, academicYear } = req.query as {
            class: string;
            subjectId: string;
            term: 'First' | 'Second' | 'Third';
            academicYear: string;
        };

        // ✅ NEW: Check if subject is offered
        const isSubjectOffered = await validateSubjectOffered(className, subjectId, term, academicYear);
        if (!isSubjectOffered) {
            return res.status(403).json({ 
                msg: "This subject is not offered in this class" 
            });
        }

        // Get all students in the class
        const allStudents = await Student.find({
            admissionNumber: { $regex: `^${className}/` }
        }).select("_id firstName lastName admissionNumber");

        // Get registered students
        const registrations = await SubjectRegistration.find({
            class: className,
            subjectId,
            term,
            academicYear,
            isActive: true
        }).select("studentId");

        const registeredIds = registrations.map(r => r.studentId.toString());
        
        // Filter out registered students
        const unregisteredStudents = allStudents.filter(
            student => !registeredIds.includes(student._id.toString())
        );

        return res.json(unregisteredStudents);

    } catch (error) {
        console.error("Get unregistered students error:", error);
        return res.status(500).json({ msg: "Server error" });
    }
}

// Copy registrations from previous term
export async function copyRegistrations(
    req: AuthRequest, 
    res: Response
): Promise<Response> {
    try {
        const { fromYear, fromTerm, toYear, toTerm, class: className } = req.body as CopyRegistrationBody;
        const staff = req.user;

        if (!staff) {
            return res.status(401).json({ msg: "Unauthorized" });
        }

        // Validate
        if (!fromYear || !fromTerm || !toYear || !toTerm || !className) {
            return res.status(400).json({ 
                msg: "Missing required fields" 
            });
        }

        // Get previous registrations
        const previousRegs = await SubjectRegistration.find({
            class: className,
            academicYear: fromYear,
            term: fromTerm,
            isActive: true
        });

        if (previousRegs.length === 0) {
            return res.status(404).json({ 
                msg: "No registrations found for the previous term" 
            });
        }

        // ✅ NEW: Filter out subjects that are no longer offered
        const validRegs = [];
        for (const reg of previousRegs) {
            const isOffered = await validateSubjectOffered(
                className, 
                reg.subjectId.toString(), 
                toTerm, 
                toYear
            );
            if (isOffered) {
                validRegs.push(reg);
            }
        }

        if (validRegs.length === 0) {
            return res.status(400).json({ 
                msg: "None of the previous subjects are offered in the target term" 
            });
        }

        // Create new registrations
        const newRegs = validRegs.map(reg => ({
            studentId: reg.studentId,
            subjectId: reg.subjectId,
            academicYear: toYear,
            term: toTerm,
            class: className,
            isActive: true,
            registeredBy: staff.id,
            registeredAt: new Date()
        }));

        // Bulk insert new registrations
        const result = await SubjectRegistration.insertMany(newRegs, { 
            ordered: false 
        });

        return res.json({
            msg: "Success",
            count: result.length,
            message: `Copied ${result.length} registrations from ${fromTerm} ${fromYear} to ${toTerm} ${toYear}`
        });

    } catch (error: any) {
        console.error("Copy registrations error:", error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({ 
                msg: "Some registrations already exist for the target term. Please check and try again." 
            });
        }
        
        return res.status(500).json({ msg: "Server error" });
    }
}

// Delete registration
export async function deleteRegistration(
    req: AuthRequest, 
    res: Response
): Promise<Response> {
    try {
        const { id } = req.params;

        const result = await SubjectRegistration.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ msg: "Registration not found" });
        }

        return res.json({ 
            msg: "Success", 
            message: "Registration deleted successfully" 
        });

    } catch (error) {
        console.error("Delete registration error:", error);
        return res.status(500).json({ msg: "Server error" });
    }
}