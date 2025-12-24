"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ClassSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    level: { type: String, required: true },
    arm: { type: String },
    subjects: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "Subject" }],
    teacherIds: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });
exports.default = mongoose_1.default.model("Class", ClassSchema);
