import { Router } from "express";
import multer from "multer";
import { adminLogin } from "../controllers/adminController";
import {
  createStaff,
  listStaff,
  createStudentAdmin,
  listStudentsAdmin,
} from "../controllers/adminResourcesController";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { getAdminDashboardStats } from "../controllers/adminDashboardController";
import { deleteStudent } from "../controllers/studentController";
import { updateAdminSettings } from "../controllers/adminSettingsController";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";

const upload = multer({ dest: process.env.UPLOAD_DIR || "uploads" });

const router = Router();

// admin auth (public)
router.post("/auth/login", adminLogin);

// protected admin UI endpoints
router.post("/staff/create", authenticate, authorize(["admin"]), createStaff);
router.get("/staff/list", authenticate, authorize(["admin"]), listStaff);

router.post(
  "/student/create",
  authenticate,
  authorize(["admin"]),
  upload.single("passport"),
  createStudentAdmin
);
router.get(
  "/student/list",
  authenticate,
  authorize(["admin"]),
  listStudentsAdmin
);
router.get(
  "/dashboard/stats",
  authenticate,
  authorize(["admin"]),
  getAdminDashboardStats
);
router.delete(
  "/student/:id",
  authenticate,
  authorize(["admin"]),
  deleteStudent
);
// get current admin profile
// get current admin profile
router.get(
  "/me",
  authenticate,
  authorize(["admin"]),
  async (req: AuthRequest, res) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });

    const user = await User.findById(req.user.id).select(
      "_id fullName username role"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  }
);
// update admin settings
router.put("/update", authenticate, authorize(["admin"]), updateAdminSettings);

export default router;
