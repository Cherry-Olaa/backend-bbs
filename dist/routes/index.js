"use strict";
// import { Router } from "express";
// import authRoutes from "./authRoutes";
// import studentRoutes from "./studentRoutes";
// import staffRoutes from "./staffRoutes";
// import classRoutes from "./classRoutes";
// import subjectRoutes from "./subjectRoutes";
// import resultRoutes from "./resultRoutes";
// // in main router
// import staffResultRoutes from "./staffResultRoute";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import {
//   upsertResult,
//   uploadExcel,
// } from "../controllers/resultController";
// import upload from "../utils/multer";
// const router = Router();
// // Main
// router.use("/auth", authRoutes);
// router.use("/students", studentRoutes);
// router.use("/staff", staffRoutes);
// router.use("/classes", classRoutes);
// router.use("/subjects", subjectRoutes);
// router.use("/staff/results", staffResultRoutes);
// // Old viewing routes
// router.use("/results", resultRoutes);
// // New upload routes
// router.post("/result/single", upsertResult);
// router.post("/result/multiple", upsertResult);
// router.post("/result/excel", upload.single("file"), uploadExcel);
// export default router;
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const studentRoutes_1 = __importDefault(require("./studentRoutes"));
const staffRoutes_1 = __importDefault(require("./staffRoutes")); // <-- merged
const classRoutes_1 = __importDefault(require("./classRoutes"));
const subjectRoutes_1 = __importDefault(require("./subjectRoutes"));
const resultRoutes_1 = __importDefault(require("./resultRoutes"));
const resultController_1 = require("../controllers/resultController");
const multer_1 = __importDefault(require("../utils/multer"));
const router = (0, express_1.Router)();
// Auth
router.use("/auth", authRoutes_1.default);
// Students
router.use("/students", studentRoutes_1.default);
// Staff (including results)
router.use("/staff", staffRoutes_1.default);
// Classes & Subjects
router.use("/classes", classRoutes_1.default);
router.use("/subjects", subjectRoutes_1.default);
// Admin result upload
router.use("/results", resultRoutes_1.default);
// New upload routes
router.post("/result/single", resultController_1.upsertResult);
router.post("/result/multiple", resultController_1.upsertResult);
router.post("/result/excel", multer_1.default.single("file"), resultController_1.uploadExcel);
exports.default = router;
