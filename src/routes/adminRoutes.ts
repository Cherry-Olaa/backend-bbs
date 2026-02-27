// routes/adminRoutes.ts
import { Router } from "express";
import multer from "multer";
import { adminLogin } from "../controllers/adminController";
import {
  createStaff,
  listStaff,
  createStudentAdmin,
  listStudentsAdmin,
} from "../controllers/adminResourcesController";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { getAdminDashboardStats } from "../controllers/adminDashboardController";
import { deleteStudent, updateStudent } from "../controllers/studentController"; // 👈 Add updateStudent here
import { updateAdminSettings } from "../controllers/adminSettingsController";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";

import {
    getAllStudents,
    getStudentsByClass,
    getUniqueClasses
} from "../controllers/adminStudentController";

import {
  getClassSubjects,
  createAndAssignSubject,
  updateSubject,
  deleteSubject,
  removeSubjectFromClass,
  copyClassSubjects,
  getAllSubjects
} from "../controllers/adminClassSubjectController";

import {
  getAllStaff,
  resetStaffPassword,
  updateStaffDetails
} from "../controllers/adminStaffManagementController";

const upload = multer({ dest: process.env.UPLOAD_DIR || "uploads" });

const router = Router();

// ============ PUBLIC ROUTES ============
router.post("/auth/login", adminLogin);

// ============ PROTECTED ROUTES ============
router.use(authenticate);
router.use(authorize(["admin"]));

// ============ STAFF MANAGEMENT ============
router.post("/staff/create", createStaff);
router.get("/staff/list", listStaff);

// ============ STUDENT MANAGEMENT ============
router.post("/student/create", upload.single("passport"), createStudentAdmin);
router.get("/student/list", listStudentsAdmin);
router.put("/student/:id", upload.single("passport"), updateStudent);  // 👈 ADD THIS ROUTE
router.delete("/student/:id", deleteStudent);

// Get all students
router.get("/students", getAllStudents);
router.get("/students/class/:className", getStudentsByClass);
router.get("/classes", getUniqueClasses);

// ============ STAFF MANAGEMENT (ADMIN) ============
router.get("/staff/all", getAllStaff);
router.post("/staff/:staffId/reset-password", resetStaffPassword);
router.put("/staff/:staffId", updateStaffDetails);

// ============ DASHBOARD ============
router.get("/dashboard/stats", getAdminDashboardStats);

// ============ ADMIN PROFILE ============
router.get("/me", async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const user = await User.findById(req.user.id).select("_id fullName username role");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
});
router.put("/update", updateAdminSettings);

// ============ CLASS SUBJECT MANAGEMENT ============
router.post("/class-subjects/create-and-assign", createAndAssignSubject);
router.put("/subjects/:id", updateSubject);
router.delete("/subjects/:id", deleteSubject);
router.delete("/class-subjects/:id", removeSubjectFromClass);
router.get("/class-subjects", getClassSubjects);
router.post("/class-subjects/copy", copyClassSubjects);
router.get("/all-subjects", getAllSubjects);

export default router;