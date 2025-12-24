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

// export default router;
import { Router } from "express";
import authRoutes from "./authRoutes";
import studentRoutes from "./studentRoutes";
import staffRoutes from "./staffRoutes"; // <-- merged
import classRoutes from "./classRoutes";
import subjectRoutes from "./subjectRoutes";
import resultRoutes from "./resultRoutes";
import { upsertResult, uploadExcel } from "../controllers/resultController";
import upload from "../utils/multer";

const router = Router();

// Auth
router.use("/auth", authRoutes);

// Students
router.use("/students", studentRoutes);

// Staff (including results)
router.use("/staff", staffRoutes);

// Classes & Subjects
router.use("/classes", classRoutes);
router.use("/subjects", subjectRoutes);

// Admin result upload
router.use("/results", resultRoutes);

// New upload routes
router.post("/result/single", upsertResult);
router.post("/result/multiple", upsertResult);
router.post("/result/excel", upload.single("file"), uploadExcel);

export default router;