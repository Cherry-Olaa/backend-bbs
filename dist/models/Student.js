"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const StudentSchema = new mongoose_1.default.Schema({
    admissionNumber: { type: String, required: true, unique: true },
    studentId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String },
    dob: { type: Date },
    gender: { type: String },
    classId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Class" },
    session: { type: String },
    guardian: { type: Object },
    passportUrl: { type: String },
    passwordHash: { type: String, required: true },
    refreshToken: { type: String }
}, { timestamps: true });
exports.default = mongoose_1.default.model("Student", StudentSchema);
