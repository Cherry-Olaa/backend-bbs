"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const UPLOAD_DIR = path_1.default.join(process.cwd(), "uploads");
// Ensure uploads folder exists
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        const ext = path_1.default.extname(file.originalname);
        const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, safeName);
    }
});
// Allow only excel
const excelFilter = (req, file, cb) => {
    const allowed = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    if (!allowed.includes(file.mimetype)) {
        cb(new Error("Only Excel files (.xlsx or .xls) are allowed"), false);
    }
    else {
        cb(null, true);
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter: excelFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});
exports.default = upload;
