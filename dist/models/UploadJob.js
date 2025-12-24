"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const UploadJobSchema = new mongoose_1.default.Schema({
    uploadedBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    fileUrl: String,
    status: { type: String, default: "pending" },
    summary: Object
}, { timestamps: true });
exports.default = mongoose_1.default.model("UploadJob", UploadJobSchema);
