import { Router } from "express";
import multer from "multer";
import {
  upsertResult,
  getStudentResults,
  generatePdf
} from "../controllers/resultController";
import { authenticate, authorize } from "../middleware/authMiddleware";

const upload = multer({ dest: process.env.UPLOAD_DIR || "uploads" });

const router = Router();

// Staff/Admin/HOD/Principal can create/update results
router.post("/", authenticate, authorize(["staff", "admin"]), upsertResult);

// Students & staff can view results
router.get("/", authenticate, authorize(["student", "staff", "admin"]), getStudentResults);

// Generate PDF (WAEC-style report card)
router.get("/pdf", authenticate, authorize(["student", "staff", "admin"]), generatePdf);

export default router;

// import { Router } from "express";
// import multer from "multer";
// import {
//   upsertResult,
//   getStudentResults,
//   uploadExcel,
//   generatePdf
// } from "../controllers/resultController";
// import { authenticate, authorize } from "../middleware/authMiddleware";

// const upload = multer({ dest: process.env.UPLOAD_DIR || "uploads" });

// const router = Router();

// router.post("/", authenticate, authorize(["staff","admin","hod","principal"]), upsertResult);
// router.post("/upload", authenticate, authorize(["staff","admin","hod","principal"]), upload.single("file"), uploadExcel);
// router.get("/", authenticate, authorize(["student","staff","admin","hod","principal"]), getStudentResults);
// router.get("/pdf", authenticate, authorize(["student","staff","admin","hod","principal"]), generatePdf);

// export default router;