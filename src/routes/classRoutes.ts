import { Router } from "express";
import { createClass, listClasses } from "../controllers/classController";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();
router.post("/", authenticate, authorize(["admin"]), createClass);
router.get("/", authenticate, authorize(["admin","staff"]), listClasses);

export default router;