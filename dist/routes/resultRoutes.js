"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const resultController_1 = require("../controllers/resultController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const upload = (0, multer_1.default)({ dest: process.env.UPLOAD_DIR || "uploads" });
const router = (0, express_1.Router)();
// Staff/Admin/HOD/Principal can create/update results
router.post("/", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["staff", "admin"]), resultController_1.upsertResult);
// Students & staff can view results
router.get("/", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["student", "staff", "admin"]), resultController_1.getStudentResults);
// Generate PDF (WAEC-style report card)
router.get("/pdf", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["student", "staff", "admin"]), resultController_1.generatePdf);
exports.default = router;
// import { Router } from "express";
// import multer from "multer";
// import {
//   upsertResult,
//   getStudentResults,
//   uploadExcel,
//   generatePdf
// } from "../controllers/resultController";
// import { authenticate, authorize } from "../middleware/authMiddleware";
// const upload = multer({ dest: process.env.UPLOAD_DIR || "uploads" });
// const router = Router();
// router.post("/", authenticate, authorize(["staff","admin","hod","principal"]), upsertResult);
// router.post("/upload", authenticate, authorize(["staff","admin","hod","principal"]), upload.single("file"), uploadExcel);
// router.get("/", authenticate, authorize(["student","staff","admin","hod","principal"]), getStudentResults);
// router.get("/pdf", authenticate, authorize(["student","staff","admin","hod","principal"]), generatePdf);
// export default router;
