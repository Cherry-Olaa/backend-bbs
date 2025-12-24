"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const SubjectSchema = new mongoose_1.default.Schema({
    code: { type: String, required: true, uppercase: true, unique: true },
    name: { type: String, required: true }
}, { timestamps: true });
exports.default = mongoose_1.default.model("Subject", SubjectSchema);
