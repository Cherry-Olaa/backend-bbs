
import { Router } from "express";
import { authenticate, authorize } from "../middleware/authMiddleware";
import {
    getStaffResults,
    uploadStaffResult,
    generateStaffPdf,
    getStaffStudentResults,
} from "../controllers/staffResultController";
import {
    getClassSubjectsForStaff,
    getEligibleStudents
} from "../controllers/staffSubjectController";
import {
    getStaffStudents,
    getStaffDashboardStats,
} from "../controllers/staffController";
import { uploadBulkStaffResults } from "../controllers/resultController";
import { getStaffProfile, updateStaffProfile } from "../controllers/staffSettingsController";

const router = Router();

// -------- Profile Routes --------
router.get("/me", authenticate, authorize(["staff"]), getStaffProfile); // ✅ Keep only ONE
router.put("/update", authenticate, authorize(["staff"]), updateStaffProfile);

// -------- Dashboard --------
router.get("/dashboard/stats", authenticate, authorize(["staff"]), getStaffDashboardStats);

// -------- Student Routes --------
router.get("/students", authenticate, authorize(["staff"]), getStaffStudents);
router.get("/class-subjects", authenticate, authorize(["staff"]), getClassSubjectsForStaff);
router.get("/eligible-students", authenticate, authorize(["staff"]), getEligibleStudents);

// -------- Result Routes --------
router.get("/results", authenticate, authorize(["staff"]), getStaffResults);
router.get("/results/student/:studentId", authenticate, authorize(["staff"]), getStaffStudentResults);
router.post("/results", authenticate, authorize(["staff"]), uploadStaffResult);
router.post("/results/bulk", authenticate, authorize(["staff"]), uploadBulkStaffResults);
router.get("/results/pdf/:studentId", authenticate, authorize(["staff"]), generateStaffPdf);

export default router;