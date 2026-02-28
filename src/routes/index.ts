// import { Router } from "express";
// import authRoutes from "./authRoutes";
// import studentRoutes from "./studentRoutes";
// import staffRoutes from "./staffRoutes";
// import classRoutes from "./classRoutes";
// import subjectRoutes from "./subjectRoutes";
// import resultRoutes from "./resultRoutes";
// // in main router
// import staffResultRoutes from "./staffResultRoute";



// import {
//   upsertResult,
//   uploadExcel,
// } from "../controllers/resultController";

// import upload from "../utils/multer";

// const router = Router();

// // Main
// router.use("/auth", authRoutes);
// router.use("/students", studentRoutes);
// router.use("/staff", staffRoutes);
// router.use("/classes", classRoutes);
// router.use("/subjects", subjectRoutes);
// router.use("/staff/results", staffResultRoutes);

// // Old viewing routes
// router.use("/results", resultRoutes);

// // New upload routes
// router.post("/result/single", upsertResult);
// router.post("/result/multiple", upsertResult);
// router.post("/result/excel", upload.single("file"), uploadExcel);
// routes/index.ts
import { Router } from "express";
import authRoutes from "./authRoutes";
import studentRoutes from "./studentRoutes";
import staffRoutes from "./staffRoutes";
import classRoutes from "./classRoutes";
import subjectRoutes from "./subjectRoutes";
import resultRoutes from "./resultRoutes";
import subjectRegistrationRoutes from "./subjectRegistrationRoutes";
import adminRoutes from "./adminRoutes";
import { upsertResult, uploadExcel } from "../controllers/resultController";
import upload from "../utils/multer";
import { authenticate } from "../middleware/authMiddleware"; // 👈 ADD THIS IMPORT
import jobRoutes from "./jobRoutes"; 


const router = Router();

// Auth routes
router.use("/auth", authRoutes);

// Admin routes
router.use("/admin", adminRoutes);

// Student routes
router.use("/students", studentRoutes);

// Staff routes
router.use("/staff", staffRoutes);

// Class & Subject routes
router.use("/classes", classRoutes);
router.use("/subjects", subjectRoutes);

// Result routes (admin)
router.use("/results", resultRoutes);

// Subject Registration routes
router.use("/subject-registrations", subjectRegistrationRoutes);
router.use("/jobs", jobRoutes);
// Additional result upload routes - 👈 ADD AUTHENTICATION HERE
router.post("/result/single", authenticate, upsertResult);      // Added authenticate
router.post("/result/multiple", authenticate, upsertResult);    // Added authenticate
router.post("/result/excel", authenticate, upload.single("file"), uploadExcel); // Added authenticate

export default router;