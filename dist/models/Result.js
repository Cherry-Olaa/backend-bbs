"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ResultSchema = new mongoose_1.default.Schema({
    studentId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Student", required: true },
    session: { type: String, required: true },
    term: { type: String, required: true },
    results: [{ subjectId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Subject" }, ca: Number, exam: Number, total: Number, grade: String, comment: String }],
    overallTotal: Number,
    average: Number,
    positionInClass: Number,
    remarks: String,
    generatedBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
ResultSchema.index({ studentId: 1, session: 1, term: 1 }, { unique: true });
exports.default = mongoose_1.default.model("Result", ResultSchema);
