"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClass = createClass;
exports.listClasses = listClasses;
const Class_1 = __importDefault(require("../models/Class"));
async function createClass(req, res) {
    const { name, level, arm } = req.body;
    if (!name || !level)
        return res.status(400).json({ message: "name & level required" });
    const c = await Class_1.default.create({ name, level, arm });
    res.json(c);
}
async function listClasses(req, res) {
    const classes = await Class_1.default.find().lean();
    res.json(classes);
}
