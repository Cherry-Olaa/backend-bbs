"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = __importDefault(require("body-parser"));
const routes_1 = __importDefault(require("./routes"));
require("express-async-errors");
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
if (!fs_1.default.existsSync(UPLOAD_DIR))
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
// static uploads
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), UPLOAD_DIR)));
// main routes
app.use("/api", routes_1.default);
// admin base (separate for UI endpoints)
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
app.use("/api/admin", adminRoutes_1.default);
app.get("/", (req, res) => res.send("BUSYBRAINS SCHOOLS API"));
app.use(errorMiddleware_1.errorHandler);
exports.default = app;
