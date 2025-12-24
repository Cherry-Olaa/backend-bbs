"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const adminController_1 = require("../controllers/adminController");
const adminResourcesController_1 = require("../controllers/adminResourcesController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const adminDashboardController_1 = require("../controllers/adminDashboardController");
const studentController_1 = require("../controllers/studentController");
const adminSettingsController_1 = require("../controllers/adminSettingsController");
const User_1 = __importDefault(require("../models/User"));
const upload = (0, multer_1.default)({ dest: process.env.UPLOAD_DIR || "uploads" });
const router = (0, express_1.Router)();
// admin auth (public)
router.post("/auth/login", adminController_1.adminLogin);
// protected admin UI endpoints
router.post("/staff/create", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["admin"]), adminResourcesController_1.createStaff);
router.get("/staff/list", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["admin"]), adminResourcesController_1.listStaff);
router.post("/student/create", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["admin"]), upload.single("passport"), adminResourcesController_1.createStudentAdmin);
router.get("/student/list", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["admin"]), adminResourcesController_1.listStudentsAdmin);
router.get("/dashboard/stats", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["admin"]), adminDashboardController_1.getAdminDashboardStats);
router.delete("/student/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["admin"]), studentController_1.deleteStudent);
// get current admin profile
// get current admin profile
router.get("/me", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["admin"]), async (req, res) => {
    if (!req.user)
        return res.status(401).json({ message: "Not authenticated" });
    const user = await User_1.default.findById(req.user.id).select("_id fullName username role");
    if (!user)
        return res.status(404).json({ message: "User not found" });
    res.json(user);
});
// update admin settings
router.put("/update", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["admin"]), adminSettingsController_1.updateAdminSettings);
exports.default = router;
