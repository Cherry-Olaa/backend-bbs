"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaffResults = getStaffResults;
exports.uploadStaffResult = uploadStaffResult;
exports.generateStaffPdf = generateStaffPdf;
exports.getStaffStudentResults = getStaffStudentResults;
const Student_1 = __importDefault(require("../models/Student"));
const Result_1 = __importDefault(require("../models/Result"));
const Subject_1 = __importDefault(require("../models/Subject"));
const resultHelpers_1 = require("./resultHelpers");
// // ---------------- GET RESULTS FOR STAFF ----------------
// export async function getStaffResults(req: Request, res: Response) {
//   try {
//     const staff = (req as any).user;
//     const assignedClasses: string[] = staff.assignedClasses; // e.g., ["25/BBS", "26/SCI"]
//     if (!assignedClasses || !assignedClasses.length) {
//       return res.status(400).json({ msg: "No classes assigned to staff" });
//     } // Fetch students only in staff's assigned classes
//     const students = await Student.find({ classId: { $in: assignedClasses } });
//     const studentIds = students.map((s) => s._id);
//     const results = await Result.find({
//       studentId: { $in: studentIds },
//     }).populate("results.subjectId", "name code");
//     res.json(results);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Server error" });
//   }
// }
// ---------------- GET RESULTS FOR STAFF ----------------
async function getStaffResults(req, res) {
    try {
        const staff = req.user;
        const assignedClasses = staff.assignedClasses; // e.g. ["25/BBS"]
        if (!assignedClasses || !assignedClasses.length) {
            return res.status(400).json({ msg: "No classes assigned to staff" });
        }
        // ✅ Match students by admissionNumber prefix (NOT classId)
        const admissionFilters = assignedClasses.map((prefix) => new RegExp(`^${prefix}/`));
        const students = await Student_1.default.find({
            admissionNumber: { $in: admissionFilters },
        }).select("_id session");
        const studentIds = students.map((s) => s._id);
        // ✅ Fetch results for those students
        const results = await Result_1.default.find({
            studentId: { $in: studentIds },
        })
            .populate("studentId", "firstName lastName admissionNumber session")
            .populate("results.subjectId", "name code")
            .sort({ createdAt: -1 });
        return res.json(results);
    }
    catch (err) {
        console.error("getStaffResults error:", err);
        return res.status(500).json({ msg: "Server error" });
    }
}
// ---------------- UPLOAD / UPDATE RESULT ----------------
async function uploadStaffResult(req, res) {
    try {
        const staff = req.user;
        const assignedClasses = staff.assignedClasses;
        if (!assignedClasses || !assignedClasses.length) {
            return res.status(400).json({ msg: "No classes assigned to staff" });
        }
        const { studentId, term, results } = req.body;
        const student = await Student_1.default.findById(studentId);
        if (!student)
            return res.status(404).json({ msg: "Student not found" }); // Only allow upload if student is in staff's classes
        const allowed = assignedClasses.some((prefix) => student.admissionNumber.startsWith(`${prefix}/`));
        if (!allowed) {
            return res.status(403).json({
                msg: "You are not allowed to upload results for this student",
            });
        }
        for (let item of results) {
            const sub = await Subject_1.default.findOneAndUpdate({ code: item.subject.toUpperCase() }, {
                $setOnInsert: {
                    code: item.subject.toUpperCase(),
                    name: item.subject.toUpperCase(),
                },
            }, { upsert: true, new: true });
            item.subjectId = sub._id;
            item.subjectId = sub._id;
            item.total = (item.ca || 0) + (item.exam || 0);
            item.grade = (0, resultHelpers_1.gradeScore)(item.total);
            item.comment = (0, resultHelpers_1.gradeComment)(item.grade);
        }
        const { overallTotal, average } = (0, resultHelpers_1.computeTotals)(results);
        let doc = await Result_1.default.findOne({
            studentId,
            session: student.session,
            term,
        });
        if (doc) {
            for (const incoming of results) {
                const index = doc.results.findIndex((r) => r.subjectId.toString() === incoming.subjectId.toString());
                if (index >= 0) {
                    // ✅ update existing subject (e.g. ENG)
                    doc.results[index].ca = incoming.ca;
                    doc.results[index].exam = incoming.exam;
                    doc.results[index].total = incoming.total;
                    doc.results[index].grade = incoming.grade;
                    doc.results[index].comment = incoming.comment;
                }
                else {
                    // ✅ add new subject if it didn't exist
                    doc.results.push(incoming);
                }
            } // 🔄 recompute totals from merged results
            const recalculated = (0, resultHelpers_1.computeTotals)(doc.results);
            doc.overallTotal = recalculated.overallTotal;
            doc.average = recalculated.average;
            doc.generatedBy = staff.id;
            await doc.save();
            return res.json({ msg: "Updated", data: doc });
        }
        const newRes = await Result_1.default.create({
            studentId,
            session: student.session,
            term,
            results,
            overallTotal,
            average,
            generatedBy: staff.id,
        });
        return res.json({ msg: "Created", data: newRes });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
}
// ---------------- PDF (placeholder) ----------------
async function generateStaffPdf(req, res) {
    res.send("PDF generator for staff not implemented yet");
}
// ---------------- GET RESULTS FOR ONE STUDENT ----------------
async function getStaffStudentResults(req, res) {
    try {
        const staff = req.user;
        const { studentId } = req.params;
        const student = await Student_1.default.findById(studentId);
        if (!student) {
            return res.status(404).json({ msg: "Student not found" });
        }
        // 🔐 Security check (same rule as upload)
        const allowed = staff.assignedClasses.some((prefix) => student.admissionNumber.startsWith(`${prefix}/`));
        if (!allowed) {
            return res.status(403).json({ msg: "Not authorized" });
        }
        const results = await Result_1.default.find({ studentId })
            .populate("results.subjectId", "name code")
            .sort({ createdAt: -1 });
        return res.json(results);
    }
    catch (err) {
        console.error("getStaffStudentResults error:", err);
        return res.status(500).json({ msg: "Server error" });
    }
}
