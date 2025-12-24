"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubject = createSubject;
exports.listSubjects = listSubjects;
const Subject_1 = __importDefault(require("../models/Subject"));
async function createSubject(req, res) {
    const { code, name } = req.body;
    if (!code || !name)
        return res.status(400).json({ message: "code & name required" });
    const s = await Subject_1.default.create({ code: code.toUpperCase(), name });
    res.json(s);
}
async function listSubjects(req, res) {
    const subjects = await Subject_1.default.find().lean();
    res.json(subjects);
}
