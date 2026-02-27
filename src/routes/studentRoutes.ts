// routes/studentRoutes.ts
import { Router } from "express";
import multer from "multer";
import { authenticate, authorize, AuthRequest } from "../middleware/authMiddleware";
import {
  createStudent,
  getMe,
  getStudentById,
  getStudentByAdmission,
  updateStudent,
  listActiveStudents,
  listAllStudents,
  deleteStudent,
  deactivateStudent,
  reactivateStudent
} from "../controllers/studentController";

const upload = multer({ dest: process.env.UPLOAD_DIR || "uploads" });
const router = Router();

// Create student (admin only)
router.post("/", authenticate, authorize(["admin"]), upload.single("passport"), createStudent);

// List students - default shows only active, use ?showInactive=true to see all
router.get("/", authenticate, authorize(["admin", "staff"]), listActiveStudents);

// List all students (including inactive) - admin only
router.get("/all", authenticate, authorize(["admin"]), listAllStudents);

// Get current student
router.get("/me", authenticate, authorize(["student"]), getMe);

// Get student by admission number (query param)
router.get("/by-admission", authenticate, authorize(["admin", "staff"]), getStudentByAdmission);

// Deactivate student (soft delete)
router.patch("/:id/deactivate", authenticate, authorize(["admin"]), deactivateStudent);

// Reactivate student
router.patch("/:id/reactivate", authenticate, authorize(["admin"]), reactivateStudent);

// Get student by ID
router.get("/:id", authenticate, authorize(["admin", "staff"]), getStudentById);

// UPDATE STUDENT - Add this route
router.put("/:id", authenticate, authorize(["admin"]), upload.single("passport"), updateStudent);

// Hard delete student (admin only)
router.delete("/:id", authenticate, authorize(["admin"]), deleteStudent);

export default router;