"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStaff = createStaff;
exports.listStaff = listStaff;
exports.createStudentAdmin = createStudentAdmin;
exports.listStudentsAdmin = listStudentsAdmin;
const User_1 = __importDefault(require("../models/User"));
const Student_1 = __importDefault(require("../models/Student"));
const hash_1 = require("../utils/hash");
const uuid_1 = require("uuid");
// create staff (admin)
async function createStaff(req, res) {
    const { fullName, username, role, assignedClasses } = req.body;
    if (!fullName ||
        !username ||
        !role ||
        !assignedClasses ||
        !assignedClasses.length) {
        return res
            .status(400)
            .json({ message: "fullName, username, role & assignedClasses required" });
    }
    const exists = await User_1.default.findOne({ username });
    if (exists)
        return res.status(400).json({ message: "Username exists" });
    const passwordPlain = "Staff@123";
    const passwordHash = await (0, hash_1.hashPassword)(passwordPlain);
    // Generate staffId for each assigned class
    const staffIds = [];
    for (const staffClass of assignedClasses) {
        // Find last staff in this class
        const lastStaff = await User_1.default.find({ assignedClasses: { $in: [staffClass] } })
            .sort({ staffId: -1 })
            .limit(1)
            .lean();
        let nextNum = 1;
        if (lastStaff.length && lastStaff[0].staffId) {
            const lastId = lastStaff[0].staffId; // safe now
            const parts = lastId.split("/"); // ["20", "BBS", "003"]
            nextNum = parseInt(parts[2], 10) + 1;
        }
        const staffId = `${staffClass}/${String(nextNum).padStart(3, "0")}`;
        staffIds.push(staffId);
    }
    // For simplicity, assign the first staffId as primary staffId
    const user = await User_1.default.create({
        username,
        fullName,
        role,
        assignedClasses,
        staffId: staffIds[0], // primary id
        passwordHash,
    });
    res.json({
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        assignedClasses: user.assignedClasses,
        staffIds, // all ids for reference
        initialPassword: passwordPlain,
    });
}
// list staff (safe fields only)
async function listStaff(req, res) {
    const staff = await User_1.default.find({ role: { $in: ["staff", "hod", "principal", "admin"] } }, "-passwordHash -refreshToken -__v").lean();
    res.json(staff);
}
// admin creates student endpoint
async function createStudentAdmin(req, res) {
    const { admissionNumber, firstName, lastName, dob, gender, session, classId, } = req.body;
    if (!admissionNumber || !firstName)
        return res
            .status(400)
            .json({ message: "admissionNumber & firstName required" });
    const exists = await Student_1.default.findOne({ admissionNumber });
    if (exists)
        return res.status(400).json({ message: "Admission number exists" });
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
        classId,
        passwordHash,
    });
    res.json({ student, initialPassword: passwordPlain });
}
// list students (admin)
async function listStudentsAdmin(req, res) {
    const { classId, session } = req.query;
    const filter = {};
    if (classId)
        filter.classId = classId;
    if (session)
        filter.session = session;
    const students = await Student_1.default.find(filter)
        .select("-passwordHash -refreshToken -__v")
        .limit(500)
        .lean();
    res.json(students);
}
