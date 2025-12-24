"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const studentController_1 = require("../controllers/studentController");
const upload = (0, multer_1.default)({ dest: process.env.UPLOAD_DIR || "uploads" });
const router = (0, express_1.Router)();
router.post("/", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["admin"]), upload.single("passport"), studentController_1.createStudent);
router.get("/", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["admin", "staff"]), studentController_1.listStudents);
router.get("/me", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["student"]), studentController_1.getMe);
router.get("/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["admin", "staff"]), studentController_1.getStudentById);
router.put("/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["admin", "staff"]), upload.single("passport"), studentController_1.updateStudent);
exports.default = router;
