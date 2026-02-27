// controllers/resultController.ts
import mongoose from "mongoose";
import { Request, Response } from "express";
import Result, { IResult } from "../models/Result";
import Student from "../models/Student";
import SubjectRegistration from "../models/SubjectRegistration";
import { IUser } from "../types";

interface AuthRequest extends Request {
    user?: IUser;
}

interface BulkResultEntry {
    studentId: string;
    classWork: number;
    homeWork: number;
    ca: number;
    exam: number;
}

interface BulkResultBody {
    class: string;
    subjectId: string;
    subjectCode: string;
    term: 'First' | 'Second' | 'Third';
    academicYear: string;
    entries: BulkResultEntry[];
}

// Helper functions
const gradeScore = (total: number): string => {
    if (total >= 85) return 'A';
    if (total >= 70) return 'B';
    if (total >= 60) return 'C';
    if (total >= 50) return 'D';
    if (total >= 40) return 'E';
    return 'F';
};

const gradeComment = (grade: string): string => {
    const comments: Record<string, string> = {
        'A': 'Excellent',
        'B': 'Very Good',
        'C': 'Good',
        'D': 'Pass',
        'E': 'Fair',
        'F': 'Fail'
    };
    return comments[grade] || 'Needs Improvement';
};

// ==================== BULK UPLOAD RESULTS ====================
export async function uploadBulkStaffResults(
    req: AuthRequest, 
    res: Response
): Promise<Response> {
    try {
        const staff = req.user;

        if (!staff) {
            return res.status(401).json({ msg: "Unauthorized" });
        }

        const assignedClasses = staff.assignedClasses;

        if (!assignedClasses || !assignedClasses.length) {
            return res.status(400).json({ msg: "No classes assigned to staff" });
        }

        const { class: className, subjectId, subjectCode, term, academicYear, entries } = req.body as BulkResultBody;

        console.log("Received bulk upload:", { 
            className, 
            subjectId, 
            subjectCode, 
            term, 
            academicYear, 
            entriesCount: entries.length 
        });

        // Validate required fields
        if (!className || !subjectId || !term || !academicYear || !entries?.length) {
            return res.status(400).json({
                msg: "Missing required fields. Please provide class, subject, term, academic year, and entries."
            });
        }

        // Verify staff has access to this class
        const hasAccess = assignedClasses.some(cls => className.startsWith(cls));
        if (!hasAccess) {
            return res.status(403).json({
                msg: "You don't have access to this class"
            });
        }

        // Get all student IDs
        const studentIds = entries.map(e => e.studentId);

        // Fetch students and verify they belong to the class
        const students = await Student.find({
            _id: { $in: studentIds },
            admissionNumber: { $regex: `^${className}/` }
        });

        if (students.length !== entries.length) {
            return res.status(403).json({
                msg: "Some students don't belong to this class"
            });
        }

        // Verify all students are registered for this subject
        const registrations = await SubjectRegistration.find({
            studentId: { $in: studentIds },
            subjectId,
            term,
            academicYear,
            isActive: true
        });

        if (registrations.length !== entries.length) {
            return res.status(403).json({
                msg: "Some students are not registered for this subject this term"
            });
        }

        const results = [];
        const errors = [];
        
        for (const entry of entries) {
            try {
                const student = students.find(
                    s => s._id.toString() === entry.studentId
                );

                if (!student) {
                    errors.push({
                        studentId: entry.studentId,
                        error: "Student not found"
                    });
                    continue;
                }

                // Extract individual scores
                const classWork = entry.classWork ?? 0;
                const homeWork = entry.homeWork ?? 0;
                const ca = entry.ca ?? 0;
                const exam = entry.exam ?? 0;

                // Validate individual score ranges
                if (classWork < 0 || classWork > 10) {
                    throw new Error(`Invalid classWork score for student ${entry.studentId}: ${classWork}. Must be between 0-10.`);
                }
                if (homeWork < 0 || homeWork > 10) {
                    throw new Error(`Invalid homeWork score for student ${entry.studentId}: ${homeWork}. Must be between 0-10.`);
                }
                if (ca < 0 || ca > 20) {
                    throw new Error(`Invalid CA score for student ${entry.studentId}: ${ca}. Must be between 0-20.`);
                }
                if (exam < 0 || exam > 60) {
                    throw new Error(`Invalid exam score for student ${entry.studentId}: ${exam}. Must be between 0-60.`);
                }

                // Calculate total
                const total = classWork + homeWork + ca + exam;
                const grade = gradeScore(total);

                // Create subject result object with individual scores
                const subjectResult = {
                    subjectId: new mongoose.Types.ObjectId(subjectId),
                    classWork,
                    homeWork,
                    ca,
                    exam,
                    total,
                    grade,
                    comment: gradeComment(grade)
                };

                // ✅ FIX 1: Use academicYear from payload, NOT student.session
                let resultDoc = await Result.findOne({
                    studentId: student._id,
                    session: academicYear,  // Use the selected academic year
                    term
                });

                if (resultDoc) {
                    // Check if this subject already exists
                    const subjectIndex = resultDoc.results.findIndex(
                        r => r.subjectId.toString() === subjectId
                    );

                    if (subjectIndex >= 0) {
                        // Update existing subject with all scores
                        resultDoc.results[subjectIndex] = subjectResult;
                    } else {
                        // Add new subject to existing results array
                        resultDoc.results.push(subjectResult);
                    }

                    // Recalculate overall totals across ALL subjects
                    const overallTotal = resultDoc.results.reduce(
                        (sum, r) => sum + (r.total || 0),
                        0
                    );

                    resultDoc.overallTotal = overallTotal;
                    resultDoc.average = Math.round((overallTotal / resultDoc.results.length) * 100) / 100;
                    resultDoc.generatedBy = staff._id;

                    resultDoc.markModified("results");
                    await resultDoc.save();

                    results.push({
                        studentId: entry.studentId,
                        status: "updated",
                        subjectsCount: resultDoc.results.length,
                        total: overallTotal
                    });
                } else {
                    // ✅ FIX 2: Use academicYear from payload for new results
                    const newResult = await Result.create({
                        studentId: student._id,
                        session: academicYear,  // Use the selected academic year
                        term,
                        results: [subjectResult],
                        overallTotal: total,
                        average: total,
                        generatedBy: staff._id
                    });

                    results.push({
                        studentId: entry.studentId,
                        status: "created",
                        subjectsCount: 1,
                        total
                    });
                }
            } catch (err: unknown) {
                const errorMessage =
                    err instanceof Error ? err.message : "Unknown error";

                console.error(
                    `Error processing student ${entry.studentId}:`,
                    errorMessage
                );

                errors.push({
                    studentId: entry.studentId,
                    error: errorMessage
                });
            }
        }

        return res.json({
            msg: "Success",
            count: results.length,
            errors: errors.length > 0 ? errors : undefined,
            message: `Successfully uploaded results for ${results.length} students in ${subjectCode} for ${academicYear} academic year${errors.length ? `, ${errors.length} failed` : ''}`
        });

    } catch (error) {
        console.error("Bulk upload error:", error);
        return res.status(500).json({ 
            msg: "Server error during bulk upload",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
// ==================== SINGLE RESULT UPLOAD ====================
export async function upsertResult(req: AuthRequest, res: Response): Promise<Response> {
    try {
        const staff = req.user;
        const { studentId, term, session, results } = req.body; // Note: session, not academicYear

        if (!staff) {
            return res.status(401).json({ msg: "Unauthorized" });
        }

        if (!studentId || !term || !session || !results || !results.length) {
            return res.status(400).json({ msg: "Missing required fields" });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ msg: "Student not found" });
        }

        // ✅ FIX: Admin can upload any student, staff only their assigned classes
        if (staff.role === 'staff') {
            const hasAccess = staff.assignedClasses?.some(cls =>
                student.admissionNumber.startsWith(`${cls}/`)
            );

            if (!hasAccess) {
                return res.status(403).json({
                    msg: "You don't have access to this student"
                });
            }
        }
        // Admin has access to all students - no check needed

        // Process each subject result with individual scores
        const processedResults = [];
        for (const item of results) {
            const classWork = item.classWork || 0;
            const homeWork = item.homeWork || 0;
            const ca = item.ca || 0;
            const exam = item.exam || 0;
            
            // Validate ranges
            if (classWork < 0 || classWork > 10 ||
                homeWork < 0 || homeWork > 10 ||
                ca < 0 || ca > 20 ||
                exam < 0 || exam > 60) {
                return res.status(400).json({ 
                    msg: "Invalid score values. ClassWork/HomeWork: 0-10, CA: 0-20, Exam: 0-60" 
                });
            }

            const total = classWork + homeWork + ca + exam;
            const grade = gradeScore(total);

            processedResults.push({
                subjectId: item.subjectId,
                classWork,
                homeWork,
                ca,
                exam,
                total,
                grade,
                comment: gradeComment(grade)
            });
        }

        // Calculate overall totals
        const overallTotal = processedResults.reduce((sum, r) => sum + r.total, 0);
        const average = overallTotal / processedResults.length;

        // Find or create result - use session from payload, not student.session
        let resultDoc = await Result.findOne({
            studentId,
            session: session,  // Use the session from payload
            term
        });

        if (resultDoc) {
            // Update existing result
            for (const newResult of processedResults) {
                const index = resultDoc.results.findIndex(
                    r => r.subjectId.toString() === newResult.subjectId.toString()
                );

                if (index >= 0) {
                    // Update existing subject
                    resultDoc.results[index] = newResult;
                } else {
                    // Add new subject
                    resultDoc.results.push(newResult);
                }
            }

            // Recalculate totals
            const newOverallTotal = resultDoc.results.reduce((sum, r) => sum + r.total, 0);
            resultDoc.overallTotal = newOverallTotal;
            resultDoc.average = Math.round((newOverallTotal / resultDoc.results.length) * 100) / 100;
            resultDoc.generatedBy = staff._id;

            resultDoc.markModified('results');
            await resultDoc.save();

            return res.json({
                msg: "Success",
                data: resultDoc,
                message: "Result updated successfully"
            });
        } else {
            // Create new result - use session from payload
            const newResult = await Result.create({
                studentId,
                session: session,  // Use the session from payload
                term,
                results: processedResults,
                overallTotal,
                average: Math.round(average * 100) / 100,
                generatedBy: staff._id
            });

            return res.json({
                msg: "Success",
                data: newResult,
                message: "Result created successfully"
            });
        }

    } catch (error) {
        console.error("Upsert result error:", error);
        return res.status(500).json({
            msg: "Server error",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
// ==================== EXCEL UPLOAD ====================
export async function uploadExcel(req: AuthRequest, res: Response): Promise<Response> {
    try {
        const staff = req.user;

        if (!staff) {
            return res.status(401).json({ msg: "Unauthorized" });
        }

        if (!req.file) {
            return res.status(400).json({ msg: "No file uploaded" });
        }

        // Here you would parse the Excel file and process results
        // This is a placeholder - you'll need to implement Excel parsing

        return res.json({
            msg: "Success",
            message: "Excel file uploaded successfully. Processing results..."
        });

    } catch (error) {
        console.error("Excel upload error:", error);
        return res.status(500).json({
            msg: "Server error during excel upload",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

// ==================== GET STUDENT FULL REPORT ====================
export async function getStudentFullReport(
    req: AuthRequest,
    res: Response
): Promise<Response> {
    try {
        const { studentId } = req.params;
        const { term, session } = req.query;

        const query: any = { studentId };
        if (term) query.term = term;
        if (session) query.session = session;

        const result = await Result.findOne(query)
            .populate("results.subjectId", "name code")
            .populate("studentId", "firstName lastName admissionNumber session")
            .lean();

        if (!result) {
            return res.status(404).json({ msg: "No results found" });
        }

        return res.json(result);
    } catch (error) {
        console.error("Get student full report error:", error);
        return res.status(500).json({ msg: "Server error" });
    }
}

// ==================== GET STUDENT RESULTS ====================
export async function getStudentResults(
    req: AuthRequest,
    res: Response
): Promise<Response> {
    try {
        const { studentId } = req.params;
        const { term, session } = req.query;

        const query: any = { studentId };
        if (term) query.term = term;
        if (session) query.session = session;

        const results = await Result.find(query)
            .populate("results.subjectId", "name code")
            .populate("studentId", "firstName lastName admissionNumber")
            .sort({ createdAt: -1 });

        return res.json(results);

    } catch (error) {
        console.error("Get student results error:", error);
        return res.status(500).json({
            msg: "Server error",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

// ==================== GET ALL RESULTS (with filters) ====================
export async function getAllResults(
    req: AuthRequest,
    res: Response
): Promise<Response> {
    try {
        const { class: className, term, session, subjectId } = req.query;
        const query: any = {};

        if (term) query.term = term;
        if (session) query.session = session;

        // If class is provided, get students in that class first
        if (className) {
            const students = await Student.find({
                admissionNumber: { $regex: `^${className}/` }
            }).select('_id');

            query.studentId = { $in: students.map(s => s._id) };
        }

        // If subject is provided, filter results that contain that subject
        let results = await Result.find(query)
            .populate("results.subjectId", "name code")
            .populate("studentId", "firstName lastName admissionNumber session")
            .sort({ createdAt: -1 });

        if (subjectId) {
            results = results.filter(r =>
                r.results.some(sub => sub.subjectId.toString() === subjectId)
            );
        }

        return res.json(results);

    } catch (error) {
        console.error("Get all results error:", error);
        return res.status(500).json({
            msg: "Server error",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

// ==================== DELETE RESULT ====================
export async function deleteResult(
    req: AuthRequest,
    res: Response
): Promise<Response> {
    try {
        const { id } = req.params;
        const staff = req.user;

        if (!staff) {
            return res.status(401).json({ msg: "Unauthorized" });
        }

        const result = await Result.findById(id);
        if (!result) {
            return res.status(404).json({ msg: "Result not found" });
        }

        // Check if staff has access to this student's result
        const student = await Student.findById(result.studentId);
        if (student) {
            const hasAccess = staff.assignedClasses?.some(cls =>
                student.admissionNumber.startsWith(`${cls}/`)
            );

            if (!hasAccess) {
                return res.status(403).json({
                    msg: "You don't have access to delete this result"
                });
            }
        }

        await result.deleteOne();

        return res.json({
            msg: "Success",
            message: "Result deleted successfully"
        });

    } catch (error) {
        console.error("Delete result error:", error);
        return res.status(500).json({
            msg: "Server error",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
// // controllers/resultController.ts
// import mongoose from "mongoose";
// import { Request, Response } from "express";
// import Result, { IResult } from "../models/Result";
// import Student from "../models/Student";
// import SubjectRegistration from "../models/SubjectRegistration";
// import { IUser, BulkResultBody } from "../types";

// interface AuthRequest extends Request {
//     user?: IUser;
// }

// // Helper functions
// const gradeScore = (total: number): string => {
//     if (total >= 70) return 'A';
//     if (total >= 60) return 'B';
//     if (total >= 50) return 'C';
//     if (total >= 45) return 'D';
//     return 'F';
// };

// const gradeComment = (grade: string): string => {
//     const comments: Record<string, string> = {
//         'A': 'Excellent',
//         'B': 'Very Good',
//         'C': 'Good',
//         'D': 'Pass',
//         'F': 'Fail'
//     };
//     return comments[grade] || 'Needs Improvement';
// };

// // ==================== BULK UPLOAD RESULTS ====================
// export async function uploadBulkStaffResults(
//     req: AuthRequest, 
//     res: Response
// ): Promise<Response> {
//     try {
//         const staff = req.user;

//         if (!staff) {
//             return res.status(401).json({ msg: "Unauthorized" });
//         }

//         const assignedClasses = staff.assignedClasses;

//         if (!assignedClasses || !assignedClasses.length) {
//             return res.status(400).json({ msg: "No classes assigned to staff" });
//         }

//         const { class: className, subjectId, subjectCode, term, academicYear, entries } = req.body as BulkResultBody;

//         // Validate required fields
//         if (!className || !subjectId || !term || !academicYear || !entries?.length) {
//             return res.status(400).json({
//                 msg: "Missing required fields. Please provide class, subject, term, academic year, and entries."
//             });
//         }

//         // Verify staff has access to this class
//         const hasAccess = assignedClasses.some(cls => className.startsWith(cls));
//         if (!hasAccess) {
//             return res.status(403).json({
//                 msg: "You don't have access to this class"
//             });
//         }

//         // Get all student IDs
//         const studentIds = entries.map(e => e.studentId);

//         // Fetch students and verify they belong to the class using admissionNumber
//         const students = await Student.find({
//             _id: { $in: studentIds },
//             admissionNumber: { $regex: `^${className}/` }
//         });

//         if (students.length !== entries.length) {
//             return res.status(403).json({
//                 msg: "Some students don't belong to this class"
//             });
//         }

//         // Verify all students are registered for this subject
//         const registrations = await SubjectRegistration.find({
//             studentId: { $in: studentIds },
//             subjectId,
//             term,
//             academicYear,
//             isActive: true
//         });

//         if (registrations.length !== entries.length) {
//             return res.status(403).json({
//                 msg: "Some students are not registered for this subject this term"
//             });
//         }

//         // Process each student's result
//         const results = [];
//         const errors = [];
        
//         for (const entry of entries) {
//             try {
//                 const student = students.find(
//                     s => s._id.toString() === entry.studentId
//                 );

//                 if (!student) {
//                     errors.push({
//                         studentId: entry.studentId,
//                         error: "Student not found"
//                     });
//                     continue;
//                 }

//                 const total = (entry.ca ?? 0) + (entry.exam ?? 0);
//                 const grade = gradeScore(total);

//                 // Properly typed subject result
//                 const subjectResult = {
//                     subjectId: new mongoose.Types.ObjectId(subjectId),
//                     ca: entry.ca ?? 0,
//                     exam: entry.exam ?? 0,
//                     total,
//                     grade,
//                     comment: gradeComment(grade)
//                 };

//                 // Find existing result
//                 let resultDoc = await Result.findOne({
//                     studentId: student._id,
//                     session: student.session,
//                     term
//                 });

//                 if (resultDoc) {
//                     const subjectIndex = resultDoc.results.findIndex(
//                         r => r.subjectId.toString() === subjectId.toString()
//                     );

//                     if (subjectIndex >= 0) {
//                         // Update existing subject
//                         resultDoc.results[subjectIndex] = subjectResult;
//                     } else {
//                         // Add new subject
//                         resultDoc.results.push(subjectResult);
//                     }

//                     // Recalculate totals
//                     const overallTotal = resultDoc.results.reduce(
//                         (sum, r) => sum + (r.total ?? 0),
//                         0
//                     );

//                     const average =
//                         resultDoc.results.length > 0
//                             ? overallTotal / resultDoc.results.length
//                             : 0;

//                     resultDoc.overallTotal = overallTotal;
//                     resultDoc.average = Math.round(average * 100) / 100;
//                     resultDoc.generatedBy = staff._id;

//                     resultDoc.markModified("results");

//                     await resultDoc.save();

//                     results.push({
//                         studentId: entry.studentId,
//                         status: "updated",
//                         total: overallTotal
//                     });
//                 } else {
//                     // Create new result
//                     const newResult = await Result.create({
//                         studentId: student._id,
//                         session: student.session,
//                         term,
//                         results: [subjectResult],
//                         overallTotal: total,
//                         average: total,
//                         generatedBy: staff._id
//                     });

//                     results.push({
//                         studentId: entry.studentId,
//                         status: "created",
//                         total
//                     });
//                 }
//             } catch (err: unknown) {
//                 const errorMessage =
//                     err instanceof Error ? err.message : "Unknown error";

//                 console.error(
//                     `Error processing student ${entry.studentId}:`,
//                     errorMessage
//                 );

//                 errors.push({
//                     studentId: entry.studentId,
//                     error: errorMessage
//                 });
//             }
//         }

//         return res.json({
//             msg: "Success",
//             count: results.length,
//             errors: errors.length > 0 ? errors : undefined,
//             message: `Successfully uploaded results for ${results.length} students in ${subjectCode}${errors.length ? `, ${errors.length} failed` : ''}`
//         });

//     } catch (error) {
//         console.error("Bulk upload error:", error);
//         return res.status(500).json({ 
//             msg: "Server error during bulk upload",
//             error: error instanceof Error ? error.message : 'Unknown error'
//         });
//     }
// }

// // ==================== SINGLE RESULT UPLOAD ====================
// export async function upsertResult(req: AuthRequest, res: Response): Promise<Response> {
//     try {
//         const staff = req.user;
//         const { studentId, term, results } = req.body;

//         if (!staff) {
//             return res.status(401).json({ msg: "Unauthorized" });
//         }

//         if (!studentId || !term || !results || !results.length) {
//             return res.status(400).json({ msg: "Missing required fields" });
//         }

//         const student = await Student.findById(studentId);
//         if (!student) {
//             return res.status(404).json({ msg: "Student not found" });
//         }

//         // Check if staff has access to this student
//         const hasAccess = staff.assignedClasses?.some(cls =>
//             student.admissionNumber.startsWith(`${cls}/`)
//         );

//         if (!hasAccess) {
//             return res.status(403).json({
//                 msg: "You don't have access to this student"
//             });
//         }

//         // Process each subject result
//         const processedResults = [];
//         for (const item of results) {
//             const total = (item.ca || 0) + (item.exam || 0);
//             const grade = gradeScore(total);

//             processedResults.push({
//                 subjectId: item.subjectId,
//                 ca: item.ca,
//                 exam: item.exam,
//                 total,
//                 grade,
//                 comment: gradeComment(grade)
//             });
//         }

//         // Calculate overall totals
//         const overallTotal = processedResults.reduce((sum, r) => sum + r.total, 0);
//         const average = overallTotal / processedResults.length;

//         // Find or create result
//         let resultDoc = await Result.findOne({
//             studentId,
//             session: student.session,
//             term
//         });

//         if (resultDoc) {
//             // Update existing result
//             for (const newResult of processedResults) {
//                 const index = resultDoc.results.findIndex(
//                     r => r.subjectId.toString() === newResult.subjectId.toString()
//                 );

//                 if (index >= 0) {
//                     // Update existing subject
//                     resultDoc.results[index] = newResult;
//                 } else {
//                     // Add new subject
//                     resultDoc.results.push(newResult);
//                 }
//             }

//             resultDoc.overallTotal = overallTotal;
//             resultDoc.average = Math.round(average * 100) / 100;
//             resultDoc.generatedBy = staff._id;

//             // Mark as modified
//             resultDoc.markModified('results');
//             await resultDoc.save();

//             return res.json({
//                 msg: "Success",
//                 data: resultDoc,
//                 message: "Result updated successfully"
//             });
//         } else {
//             // Create new result
//             const newResult = await Result.create({
//                 studentId,
//                 session: student.session,
//                 term,
//                 results: processedResults,
//                 overallTotal,
//                 average,
//                 generatedBy: staff._id
//             });

//             return res.json({
//                 msg: "Success",
//                 data: newResult,
//                 message: "Result created successfully"
//             });
//         }

//     } catch (error) {
//         console.error("Upsert result error:", error);
//         return res.status(500).json({
//             msg: "Server error",
//             error: error instanceof Error ? error.message : 'Unknown error'
//         });
//     }
// }

// // ==================== EXCEL UPLOAD ====================
// export async function uploadExcel(req: AuthRequest, res: Response): Promise<Response> {
//     try {
//         const staff = req.user;

//         if (!staff) {
//             return res.status(401).json({ msg: "Unauthorized" });
//         }

//         if (!req.file) {
//             return res.status(400).json({ msg: "No file uploaded" });
//         }

//         // Here you would parse the Excel file and process results
//         // This is a placeholder - you'll need to implement Excel parsing

//         return res.json({
//             msg: "Success",
//             message: "Excel file uploaded successfully. Processing results..."
//         });

//     } catch (error) {
//         console.error("Excel upload error:", error);
//         return res.status(500).json({
//             msg: "Server error during excel upload",
//             error: error instanceof Error ? error.message : 'Unknown error'
//         });
//     }
// }

// // ==================== GET STUDENT RESULTS ====================
// export async function getStudentResults(
//     req: AuthRequest,
//     res: Response
// ): Promise<Response> {
//     try {
//         const { studentId } = req.params;
//         const { term, session } = req.query;

//         const query: any = { studentId };
//         if (term) query.term = term;
//         if (session) query.session = session;

//         const results = await Result.find(query)
//             .populate("results.subjectId", "name code")
//             .populate("studentId", "firstName lastName admissionNumber")
//             .sort({ createdAt: -1 });

//         return res.json(results);

//     } catch (error) {
//         console.error("Get student results error:", error);
//         return res.status(500).json({
//             msg: "Server error",
//             error: error instanceof Error ? error.message : 'Unknown error'
//         });
//     }
// }

// // ==================== GET ALL RESULTS (with filters) ====================
// export async function getAllResults(
//     req: AuthRequest,
//     res: Response
// ): Promise<Response> {
//     try {
//         const { class: className, term, session, subjectId } = req.query;
//         const query: any = {};

//         if (term) query.term = term;
//         if (session) query.session = session;

//         // If class is provided, get students in that class first
//         if (className) {
//             const students = await Student.find({
//                 admissionNumber: { $regex: `^${className}/` }
//             }).select('_id');

//             query.studentId = { $in: students.map(s => s._id) };
//         }

//         // If subject is provided, filter results that contain that subject
//         let results = await Result.find(query)
//             .populate("results.subjectId", "name code")
//             .populate("studentId", "firstName lastName admissionNumber session")
//             .sort({ createdAt: -1 });

//         if (subjectId) {
//             results = results.filter(r =>
//                 r.results.some(sub => sub.subjectId.toString() === subjectId)
//             );
//         }

//         return res.json(results);

//     } catch (error) {
//         console.error("Get all results error:", error);
//         return res.status(500).json({
//             msg: "Server error",
//             error: error instanceof Error ? error.message : 'Unknown error'
//         });
//     }
// }

// // ==================== DELETE RESULT ====================
// export async function deleteResult(
//     req: AuthRequest,
//     res: Response
// ): Promise<Response> {
//     try {
//         const { id } = req.params;
//         const staff = req.user;

//         if (!staff) {
//             return res.status(401).json({ msg: "Unauthorized" });
//         }

//         const result = await Result.findById(id);
//         if (!result) {
//             return res.status(404).json({ msg: "Result not found" });
//         }

//         // Check if staff has access to this student's result
//         const student = await Student.findById(result.studentId);
//         if (student) {
//             const hasAccess = staff.assignedClasses?.some(cls =>
//                 student.admissionNumber.startsWith(`${cls}/`)
//             );

//             if (!hasAccess) {
//                 return res.status(403).json({
//                     msg: "You don't have access to delete this result"
//                 });
//             }
//         }

//         await result.deleteOne();

//         return res.json({
//             msg: "Success",
//             message: "Result deleted successfully"
//         });

//     } catch (error) {
//         console.error("Delete result error:", error);
//         return res.status(500).json({
//             msg: "Server error",
//             error: error instanceof Error ? error.message : 'Unknown error'
//         });
//     }
// }