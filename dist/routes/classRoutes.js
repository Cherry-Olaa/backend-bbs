"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const classController_1 = require("../controllers/classController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post("/", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["admin"]), classController_1.createClass);
router.get("/", authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(["admin", "staff"]), classController_1.listClasses);
exports.default = router;
