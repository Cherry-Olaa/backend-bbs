"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStudent = createStudent;
exports.getMe = getMe;
exports.getStudentById = getStudentById;
exports.updateStudent = updateStudent;
exports.listStudents = listStudents;
exports.deleteStudent = deleteStudent;
const Student_1 = __importDefault(require("../models/Student"));
const hash_1 = require("../utils/hash");
const uuid_1 = require("uuid");
const Result_1 = __importDefault(require("../models/Result"));
// =======================
// CREATE STUDENT (ADMIN)
// =======================
async function createStudent(req, res) {
    try {
        const { admissionNumber, firstName, lastName, dob, gender, session } = req.body;
        if (!admissionNumber || !firstName) {
            return res.status(400).json({ message: "admissionNumber & firstName required" });
        }
        const exists = await Student_1.default.findOne({ admissionNumber });
        if (exists) {
            return res.status(400).json({ message: "Admission number already exists" });
        }
        // Generate studentId + default password
        const studentId = `STD-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`;
        const passwordPlain = String(firstName).trim();
        const passwordHash = await (0, hash_1.hashPassword)(passwordPlain);
        const passportUrl = req.file ? req.file.path : undefined;
        const student = await Student_1.default.create({
            admissionNumber,
            studentId,
            firstName,
            lastName,
            dob,
            gender,
            session,
            passportUrl,
            passwordHash,
        });
        return res.json({
            message: "Student created successfully",
            student,
            initialPassword: passwordPlain,
        });
    }
    catch (error) {
        console.error("Create Student Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
}
// =======================
// GET LOGGED IN STUDENT /me
// =======================
async function getMe(req, res) {
    try {
        const studentId = req.user?.id;
        if (!studentId) {
            return res.status(400).json({ message: "No student ID in token" });
        }
        const student = await Student_1.default.findById(studentId).select("-passwordHash").lean();
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        return res.json(student);
    }
    catch (error) {
        console.error("Get Me Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
}
// =======================
// GET STUDENT BY PARAM ID (Admin/Staff)
// =======================
async function getStudentById(req, res) {
    try {
        const id = req.params.id;
        const student = await Student_1.default.findById(id).select("-passwordHash").lean();
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        return res.json(student);
    }
    catch (error) {
        console.error("Get Student Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
}
// =======================
// UPDATE STUDENT
// =======================
async function updateStudent(req, res) {
    try {
        const id = req.params.id;
        const update = req.body;
        if (req.file) {
            update.passportUrl = req.file.path;
        }
        const student = await Student_1.default.findByIdAndUpdate(id, update, { new: true });
        return res.json(student);
    }
    catch (error) {
        console.error("Update Student Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
}
// =======================
// LIST STUDENTS (Admin/Staff)
// =======================
async function listStudents(req, res) {
    try {
        const { classId, session } = req.query;
        const filter = {};
        if (classId)
            filter.classId = classId;
        if (session)
            filter.session = session;
        const students = await Student_1.default.find(filter).limit(200).lean();
        return res.json(students);
    }
    catch (error) {
        console.error("List Students Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
}
async function deleteStudent(req, res) {
    try {
        const { id } = req.params;
        const student = await Student_1.default.findById(id);
        if (!student) {
            return res.status(404).json({ msg: "Student not found" });
        }
        // 🔥 delete all results belonging to this student
        await Result_1.default.deleteMany({ studentId: student._id });
        await student.deleteOne();
        return res.json({ msg: "Student deleted successfully" });
    }
    catch (err) {
        console.error("Delete student error:", err);
        return res.status(500).json({ msg: "Failed to delete student" });
    }
}
