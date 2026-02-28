// routes/jobRoutes.ts
import { Router } from "express";
import multer from "multer";
import { authenticate, authorize } from "../middleware/authMiddleware";
import {
  getActiveJobs,
  getJobBySlug,
  createJob,
  getJobById,  // Make sure this is imported
  getAllJobs,
  updateJob,
  deleteJob,
  toggleJobStatus
} from "../controllers/jobController";
import {
  submitApplication,
  getJobApplications,
  getAllApplications,
  getApplication,
  updateApplicationStatus,
  downloadResume
} from "../controllers/jobApplicationController";

const upload = multer({ dest: process.env.UPLOAD_DIR || "uploads/resumes" });
const router = Router();

// ============ PUBLIC ROUTES ============
router.get("/public", getActiveJobs);
router.get("/public/:slug", getJobBySlug);
router.post("/apply", upload.single("resume"), submitApplication);

// ============ ADMIN ROUTES ============
router.use(authenticate);
router.use(authorize(["admin"]));

// Job management
router.post("/", createJob);
router.get("/", getAllJobs);
router.get("/:id", getJobById);  // ✅ Use getJobById for ID lookup
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);
router.patch("/:id/toggle", toggleJobStatus);
// ❌ REMOVE this duplicate line: router.get("/:id", getJobBySlug);

// Application management
router.get("/applications/all", getAllApplications);
router.get("/:jobId/applications", getJobApplications);
router.get("/application/:id", getApplication);
router.patch("/application/:id/status", updateApplicationStatus);
router.get("/application/:id/resume", downloadResume);

export default router;