import { Router } from "express";
import { authenticate, authorize } from "../middleware/authMiddleware";
// import { listStaff } from "../controllers/staffController";
import {
    getStaffResults,
    uploadStaffResult,
    generateStaffPdf,
    getStaffStudentResults, // ✅ ADD
    // <-- add this
  } from "../controllers/staffResultController";

  import {
  
    getStaffStudents,  // <-- add this
  } from "../controllers/staffController";

  import { getStaffDashboardStats } from "../controllers/staffController";

// routes/staffRoute.ts



import { getStaffProfile, updateStaffProfile } from "../controllers/staffSettingsController";





const router = Router();
router.get(
    "/results/student/:studentId",
    authenticate,
    authorize(["staff"]),
    getStaffStudentResults
  );
// -------- Admin-only --------
// List all registered staff
// Get current staff profile
router.get("/me", authenticate, authorize(["staff"]), getStaffProfile);

// Update staff profile
router.put("/update", authenticate, authorize(["staff"]), updateStaffProfile);


// GET dashboard stats for staff
router.get("/dashboard/stats", authenticate, authorize(["staff"]), getStaffDashboardStats);
// -------- Staff-only --------
// GET all students/results for staff's class/session
router.get("/results", authenticate, authorize(["staff"]), getStaffResults);

// POST/upload result for a student
router.post("/results", authenticate, authorize(["staff"]), uploadStaffResult);

// GET PDF for a specific student
router.get("/results/pdf/:studentId", authenticate, authorize(["staff"]), generateStaffPdf);
// GET students for staff
router.get("/students", authenticate, authorize(["staff"]), getStaffStudents);
export default router;