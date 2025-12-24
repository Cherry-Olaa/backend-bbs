"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const UserSchema = new mongoose_1.default.Schema({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true },
    role: {
        type: String,
        enum: ["admin", "principal", "hod", "staff", "student"],
        required: true,
    },
    staffId: { type: String },
    assignedClasses: {
        type: [String],
        required: true,
    },
    refreshToken: { type: String },
}, { timestamps: true });
exports.default = mongoose_1.default.model("User", UserSchema);
