"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertResult = upsertResult;
exports.uploadExcel = uploadExcel;
exports.getStudentResults = getStudentResults;
exports.generatePdf = generatePdf;
const Result_1 = __importDefault(require("../models/Result"));
const Student_1 = __importDefault(require("../models/Student"));
const Subject_1 = __importDefault(require("../models/Subject"));
const xlsx_1 = __importDefault(require("xlsx"));
// -------------------- HELPERS --------------------
const gradeScore = (score) => {
    if (score >= 70)
        return "A";
    if (score >= 60)
        return "B";
    if (score >= 50)
        return "C";
    if (score >= 45)
        return "D";
    if (score >= 40)
        return "E";
    return "F";
};
const gradeComment = (grade) => {
    const mapping = {
        A: "Excellent",
        B: "Very Good",
        C: "Good",
        D: "Fair",
        E: "Pass",
        F: "Fail",
    };
    return mapping[grade] || "";
};
const computeTotals = (results) => {
    const overall = results.reduce((sum, it) => sum + (it.total || 0), 0);
    return {
        overallTotal: overall,
        average: results.length ? Number((overall / results.length).toFixed(2)) : 0,
    };
};
// =========================================================
// 1️⃣ UPSERT — SINGLE OR MULTIPLE (WEBSITE FORM)
// =========================================================
async function upsertResult(req, res) {
    try {
        const { admissionNumber, results, data } = req.body; // CASE A: Single student upload
        if (admissionNumber && results)
            return await handleSingleStudent(req, res); // CASE B: Multiple students
        if (Array.isArray(data))
            return await handleMultipleStudents(req, res);
        return res.status(400).json({ msg: "Invalid request format" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ msg: "Server error" });
    }
}
// =========================================================
// HANDLE SINGLE STUDENT
// =========================================================
async function handleSingleStudent(req, res) {
    const { admissionNumber, session, term, results } = req.body;
    const student = await Student_1.default.findOne({ admissionNumber });
    if (!student)
        return res.status(404).json({ msg: "Student not found" });
    const studentObjectId = student._id;
    if (!student)
        return res.status(404).json({ msg: "Student not found" });
    for (let item of results) {
        // Find or create session-specific subject
        let sub = await Subject_1.default.findOne({
            code: item.subject.toUpperCase(),
        });
        if (!sub) {
            sub = await Subject_1.default.create({
                code: item.subject.toUpperCase(),
                name: item.subject.toUpperCase(),
            });
        }
        item.subjectId = sub._id;
        item.total = (item.ca || 0) + (item.exam || 0);
        item.grade = gradeScore(item.total);
        item.comment = gradeComment(item.grade);
    }
    const { overallTotal, average } = computeTotals(results);
    let doc = await Result_1.default.findOne({
        studentId: studentObjectId,
        session,
        term,
    });
    if (doc) {
        for (let incoming of results) {
            const index = doc.results.findIndex((r) => r.subjectId.toString() === incoming.subjectId.toString());
            if (index >= 0) {
                doc.results[index] = incoming;
            }
            else {
                doc.results.push(incoming);
            }
        }
        const { overallTotal, average } = computeTotals(doc.results);
        doc.overallTotal = overallTotal;
        doc.average = average;
        doc.generatedBy = req.user?.id;
        await doc.save();
        return res.json({ msg: "Updated", data: doc });
    }
    const newRes = await Result_1.default.create({
        studentId: studentObjectId,
        session,
        term,
        results,
        overallTotal,
        average,
        generatedBy: req.user?.id,
    });
    return res.json({ msg: "Created", data: newRes });
}
// =========================================================
// HANDLE MULTIPLE STUDENTS
// =========================================================
async function handleMultipleStudents(req, res) {
    const { session, term, data } = req.body;
    let responses = [];
    for (let row of data) {
        const { studentId, results } = row;
        const student = await Student_1.default.findOne({ admissionNumber: studentId });
        if (!student) {
            responses.push({ studentId, error: "Student not found" });
            continue;
        }
        const studentObjectId = student._id;
        for (let item of results) {
            const sub = await Subject_1.default.findOneAndUpdate({ code: item.subject.toUpperCase() }, { $setOnInsert: { name: item.subject.toUpperCase() } }, { upsert: true, new: true });
            // let sub = await Subject.findOne({
            //     code: item.subject.toUpperCase(),
            // });
            // if (!sub) {
            //     sub = await Subject.create({
            //         code: item.subject.toUpperCase(),
            //         name: item.subject.toUpperCase(),
            //         session,
            //     });
            // }
            item.subjectId = sub._id;
            item.total = (item.ca || 0) + (item.exam || 0);
            item.grade = gradeScore(item.total);
            item.comment = gradeComment(item.grade);
        }
        const { overallTotal, average } = computeTotals(results);
        let doc = await Result_1.default.findOne({ studentObjectId, session, term });
        if (doc) {
            for (let incoming of results) {
                const index = doc.results.findIndex((r) => r.subjectId.toString() === incoming.subjectId.toString());
                if (index >= 0) {
                    doc.results[index] = incoming;
                }
                else {
                    doc.results.push(incoming);
                }
            }
            const { overallTotal, average } = computeTotals(doc.results);
            doc.overallTotal = overallTotal;
            doc.average = average;
            doc.generatedBy = req.user?.id;
            await doc.save();
            responses.push({ studentId, status: "updated" });
        }
    }
    return res.json(responses);
}
// =========================================================
// EXCEL UPLOAD
// =========================================================
async function uploadExcel(req, res) {
    try {
        if (!req.file)
            return res.status(400).json({ msg: "Excel file required" });
        const workbook = xlsx_1.default.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx_1.default.utils.sheet_to_json(sheet);
        let output = [];
        for (let row of rows) {
            const student = await Student_1.default.findOne({
                admissionNumber: row.admissionNumber,
            });
            if (!student) {
                output.push({
                    admissionNumber: row.admissionNumber,
                    error: "Student not found",
                });
                continue;
            }
            const results = JSON.parse(row.results);
            for (let item of results) {
                let sub = await Subject_1.default.findOne({
                    code: item.subject.toUpperCase(),
                });
                if (!sub) {
                    sub = await Subject_1.default.create({
                        code: item.subject.toUpperCase(),
                        name: item.subject.toUpperCase(),
                    });
                }
                item.subjectId = sub._id;
                item.total = (item.ca || 0) + (item.exam || 0);
                item.grade = gradeScore(item.total);
                item.comment = gradeComment(item.grade);
            }
            const { overallTotal, average } = computeTotals(results);
            let doc = await Result_1.default.findOne({
                studentId: student._id,
                session: row.session,
                term: row.term,
            });
            if (doc) {
                doc.results = results;
                doc.overallTotal = overallTotal;
                doc.average = average;
                await doc.save();
                output.push({
                    admissionNumber: row.admissionNumber,
                    status: "updated",
                });
            }
            else {
                await Result_1.default.create({
                    studentId: student._id,
                    session: row.session,
                    term: row.term,
                    results,
                    overallTotal,
                    average,
                });
                output.push({
                    admissionNumber: row.admissionNumber,
                    status: "created",
                });
            }
        }
        return res.json(output);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
}
// =========================================================
// GET — VIEW RESULTS
// =========================================================
async function getStudentResults(req, res) {
    try {
        const user = req.user;
        let query = {};
        if (user.role === "student")
            query.studentId = user.id;
        else {
            if (req.query.studentId)
                query.studentId = req.query.studentId;
            if (req.query.session)
                query.session = req.query.session;
            if (req.query.term)
                query.term = req.query.term;
        }
        const results = await Result_1.default.find(query).populate("results.subjectId", "name code"); // Populate only name & code
        return res.json(results);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ msg: "Server error" });
    }
}
// =========================================================
// PDF (placeholder)
async function generatePdf(req, res) {
    res.send("PDF generator not implemented yet");
}
// import { Request, Response } from "express";
// import Result from "../models/Result";
// import Student from "../models/Student";
// import Subject from "../models/Subject";
// import xlsx from "xlsx";
// // -------------------- HELPERS --------------------
// const gradeScore = (score: number): string => {
//     if (score >= 70) return "A";
//     if (score >= 60) return "B";
//     if (score >= 50) return "C";
//     if (score >= 45) return "D";
//     if (score >= 40) return "E";
//     return "F";
// };
// const gradeComment = (grade: string): string => {
//     const m: Record<string, string> = {
//         A: "Excellent",
//         B: "Very Good",
//         C: "Good",
//         D: "Fair",
//         E: "Pass",
//         F: "Fail",
//     };
//     return m[grade] || "";
// };
// const computeTotals = (results: any[]) => {
//     const overall = results.reduce((sum, it) => sum + (it.total || 0), 0);
//     return {
//         overallTotal: overall,
//         average: results.length ? Number((overall / results.length).toFixed(2)) : 0,
//     };
// };
// // =========================================================
// // 1️⃣ UPSERT — SINGLE OR MULTIPLE (WEBSITE FORM)
// // =========================================================
// export async function upsertResult(req: Request, res: Response) {
//     try {
//         const { session, term, studentId, results, data } = req.body;
//         // CASE A: Single student upload
//         if (studentId && results) {
//             return await handleSingleStudent(req, res);
//         }
//         // CASE B: Multiple upload (array)
//         if (Array.isArray(data)) {
//             return await handleMultipleStudents(req, res);
//         }
//         return res.status(400).json({ msg: "Invalid request format" });
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ msg: "Server error" });
//     }
// }
// // =========================================================
// // HANDLE SINGLE STUDENT
// // =========================================================
// async function handleSingleStudent(req: Request, res: Response) {
//     const { studentId, session, term, results } = req.body;
//     const student = await Student.findById(studentId);
//     if (!student) return res.status(404).json({ msg: "Student not found" });
//     for (let item of results) {
//         // Expect item.subjectCode instead of subjectId
//         const sub = await Subject.findOne({ code: item.subjectCode.toUpperCase() });
//         if (!sub) return res.status(400).json({ msg: `Invalid subject code: ${item.subjectCode}` });
//         item.subjectId = sub._id; // save the _id in the Result document
//         item.total = (item.ca || 0) + (item.exam || 0);
//         item.grade = gradeScore(item.total);
//         item.comment = gradeComment(item.grade);
//     }
//     const { overallTotal, average } = computeTotals(results);
//     let doc = await Result.findOne({ studentId, session, term });
//     if (doc) {
//         doc.results = results;
//         doc.overallTotal = overallTotal;
//         doc.average = average;
//         doc.generatedBy = (req as any).user?.id;
//         await doc.save();
//         return res.json({ msg: "Updated", data: doc });
//     }
//     const newRes = await Result.create({
//         studentId,
//         session,
//         term,
//         results,
//         overallTotal,
//         average,
//         generatedBy: (req as any).user?.id,
//     });
//     return res.json({ msg: "Created", data: newRes });
// }
// // =========================================================
// // HANDLE MULTIPLE STUDENTS
// // =========================================================
// async function handleMultipleStudents(req: Request, res: Response) {
//     const { session, term, data } = req.body;
//     let responses = [];
//     for (let row of data) {
//         const { studentId, results } = row;
//         const student = await Student.findById(studentId);
//         if (!student) {
//             responses.push({ studentId, error: "Student not found" });
//             continue;
//         }
//         for (let item of results) {
//             const sub = await Subject.findById(item.subjectId);
//             if (!sub) {
//                 responses.push({ studentId, error: `Invalid subjectId ${item.subjectId}` });
//                 continue;
//             }
//             item.total = (item.ca || 0) + (item.exam || 0);
//             item.grade = gradeScore(item.total);
//             item.comment = gradeComment(item.grade);
//         }
//         const { overallTotal, average } = computeTotals(results);
//         let doc = await Result.findOne({ studentId, session, term });
//         if (doc) {
//             doc.results = results;
//             doc.overallTotal = overallTotal;
//             doc.average = average;
//             await doc.save();
//             responses.push({ studentId, status: "updated" });
//         } else {
//             await Result.create({
//                 studentId,
//                 session,
//                 term,
//                 results,
//                 overallTotal,
//                 average,
//             });
//             responses.push({ studentId, status: "created" });
//         }
//     }
//     return res.json(responses);
// }
// // =========================================================
// // 3️⃣ EXCEL UPLOAD
// // =========================================================
// export async function uploadExcel(req: Request, res: Response) {
//     try {
//         if (!req.file) return res.status(400).json({ msg: "Excel file required" });
//         const workbook = xlsx.readFile(req.file.path);
//         const sheet = workbook.Sheets[workbook.SheetNames[0]];
//         const rows: any[] = xlsx.utils.sheet_to_json(sheet);
//         let output = [];
//         for (let row of rows) {
//             const student = await Student.findOne({ admissionNumber: row.admissionNumber });
//             if (!student) {
//                 output.push({ admissionNumber: row.admissionNumber, error: "Student not found" });
//                 continue;
//             }
//             let results = JSON.parse(row.results);
//             for (let item of results) {
//                 const sub = await Subject.findById(item.subjectId);
//                 if (!sub) continue;
//                 item.total = (item.ca || 0) + (item.exam || 0);
//                 item.grade = gradeScore(item.total);
//                 item.comment = gradeComment(item.grade);
//             }
//             const { overallTotal, average } = computeTotals(results);
//             let doc = await Result.findOne({
//                 studentId: student._id,
//                 session: row.session,
//                 term: row.term,
//             });
//             if (doc) {
//                 doc.results = results;
//                 doc.overallTotal = overallTotal;
//                 doc.average = average;
//                 await doc.save();
//                 output.push({ admissionNumber: row.admissionNumber, status: "updated" });
//             } else {
//                 await Result.create({
//                     studentId: student._id,
//                     session: row.session,
//                     term: row.term,
//                     results,
//                     overallTotal,
//                     average,
//                 });
//                 output.push({ admissionNumber: row.admissionNumber, status: "created" });
//             }
//         }
//         return res.json(output);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ msg: "Server error" });
//     }
// }
// // =========================================================
// // 4️⃣ GET — VIEW RESULTS
// // =========================================================
// export async function getStudentResults(req: Request, res: Response) {
//     try {
//         const user = (req as any).user;
//         let query: any = {};
//         if (user.role === "student") {
//             query.studentId = user.id;
//         } else {
//             if (req.query.studentId) query.studentId = req.query.studentId;
//             if (req.query.session) query.session = req.query.session;
//             if (req.query.term) query.term = req.query.term;
//         }
//         const results = await Result.find(query).populate("results.subjectId");
//         res.json(results);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ msg: "Server error" });
//     }
// }
// // =========================================================
// // 5️⃣ GENERATE PDF (placeholder)
// // =========================================================
// export async function generatePdf(req: Request, res: Response) {
//     res.send("PDF generator not implemented yet");
// }
