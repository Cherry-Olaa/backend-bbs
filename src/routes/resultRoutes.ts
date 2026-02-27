// routes/resultRoutes.ts
import { Router } from "express";
import multer from "multer";
import {
  upsertResult,
  getStudentResults,
  getAllResults,
  deleteResult,
  uploadExcel
} from "../controllers/resultController";
import { authenticate, authorize } from "../middleware/authMiddleware";

const upload = multer({ dest: process.env.UPLOAD_DIR || "uploads" });
const router = Router();

// Get results by studentId query parameter
router.get("/", authenticate, async (req, res) => {
  const { studentId } = req.query;
  if (studentId) {
    // Forward to getStudentResults
    req.params.studentId = studentId as string;
    return getStudentResults(req, res);
  }
  return getAllResults(req, res);
});

// Staff/Admin can create/update results
router.post("/", authenticate, authorize(["staff", "admin"]), upsertResult);

// Get all results with filters (for admin/staff)
router.get("/all", authenticate, authorize(["staff", "admin"]), getAllResults);

// Students & staff can view specific student results by param
router.get("/student/:studentId", authenticate, authorize(["student", "staff", "admin"]), getStudentResults);

// Delete result (admin/staff only)
router.delete("/:id", authenticate, authorize(["staff", "admin"]), deleteResult);

// Excel upload
router.post("/excel", authenticate, authorize(["staff", "admin"]), upload.single("file"), uploadExcel);

export default router;