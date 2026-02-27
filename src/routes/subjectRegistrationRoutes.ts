import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware"; // Use the same import
import {
    bulkRegisterSubjects,
    getRegisteredStudents,
    getUnregisteredStudents,
    copyRegistrations,
    deleteRegistration
} from "../controllers/subjectRegistrationController";

const router = express.Router();

// All routes require authentication and staff/admin role
router.use(authenticate);
router.use(authorize(["staff", "admin"]));

// Get registered students for a subject
router.get("/", getRegisteredStudents);

// Get unregistered students for a subject
router.get("/unregistered", getUnregisteredStudents);

// Bulk register students
router.post("/bulk", bulkRegisterSubjects);

// Copy registrations from previous term
router.post("/copy", copyRegistrations);

// Delete a registration
router.delete("/:id", deleteRegistration);

export default router;