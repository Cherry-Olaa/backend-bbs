// routes/subjectRoutes.ts
import { Router } from "express";
import { authenticate, authorize } from "../middleware/authMiddleware";
import {
    createSubject,
    getAllSubjects,
    updateSubject,
    deleteSubject
} from "../controllers/subjectController";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all subjects (accessible by all authenticated users)
router.get("/", getAllSubjects);

// Create subject (admin only)
router.post("/", authorize(["admin"]), createSubject);

// Update subject (admin only)
router.put("/:id", authorize(["admin"]), updateSubject);

// Delete subject (admin only)
router.delete("/:id", authorize(["admin"]), deleteSubject);

export default router;