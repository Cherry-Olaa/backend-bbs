import { Router } from "express";
import multer from "multer";
import { authenticate, authorize } from "../middleware/authMiddleware";
import {
  createStudent,
  getMe,
  getStudentById,
  updateStudent,
  listStudents
} from "../controllers/studentController";

const upload = multer({ dest: process.env.UPLOAD_DIR || "uploads" });
const router = Router();

router.post("/", authenticate, authorize(["admin"]), upload.single("passport"), createStudent);

router.get("/", authenticate, authorize(["admin", "staff"]), listStudents);

router.get("/me", authenticate, authorize(["student"]), getMe);

router.get("/:id", authenticate, authorize(["admin", "staff"]), getStudentById);

router.put("/:id", authenticate, authorize(["admin", "staff"]), upload.single("passport"), updateStudent);

export default router;