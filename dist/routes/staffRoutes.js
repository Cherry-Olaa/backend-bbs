"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
// import { listStaff } from "../controllers/staffController";
const staffResultController_1 = require("../controllers/staffResultController");
const staffController_1 = require("../controllers/staffController");
const staffController_2 = require("../controllers/staffController");
// routes/staffRoute.ts
const staffSettingsController_1 = require("../controllers/staffSettingsController");
const router = (0, express_1.Router)();
router.get("/results/student/:studentId", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["staff"]), staffResultController_1.getStaffStudentResults);
// -------- Admin-only --------
// List all registered staff
// Get current staff profile
router.get("/me", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["staff"]), staffSettingsController_1.getStaffProfile);
// Update staff profile
router.put("/update", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["staff"]), staffSettingsController_1.updateStaffProfile);
// GET dashboard stats for staff
router.get("/dashboard/stats", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["staff"]), staffController_2.getStaffDashboardStats);
// -------- Staff-only --------
// GET all students/results for staff's class/session
router.get("/results", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["staff"]), staffResultController_1.getStaffResults);
// POST/upload result for a student
router.post("/results", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["staff"]), staffResultController_1.uploadStaffResult);
// GET PDF for a specific student
router.get("/results/pdf/:studentId", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["staff"]), staffResultController_1.generateStaffPdf);
// GET students for staff
router.get("/students", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["staff"]), staffController_1.getStaffStudents);
exports.default = router;
