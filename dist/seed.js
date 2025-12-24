"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config_1 = require("./config/config");
const User_1 = __importDefault(require("./models/User"));
const Student_1 = __importDefault(require("./models/Student"));
const hash_1 = require("./utils/hash");
async function seed() {
    await (0, config_1.connectDB)();
    // Create super admin if not exists
    const adminUser = await User_1.default.findOne({ username: "admin" });
    if (!adminUser) {
        const passwordHash = await (0, hash_1.hashPassword)("Admin@123");
        await User_1.default.create({ username: "admin", passwordHash, fullName: "Super Admin", role: "admin" });
        console.log("Created admin user: admin (Admin@123)");
    }
    else {
        console.log("Admin user exists");
    }
    // Create sample staff if not exists
    const staffUser = await User_1.default.findOne({ username: "teacher1@busybrains" });
    if (!staffUser) {
        const passwordHash = await (0, hash_1.hashPassword)("Staff@123");
        await User_1.default.create({ username: "teacher1@busybrains", passwordHash, fullName: "Teacher One", role: "staff" });
        console.log("Created staff user: teacher1@busybrains (Staff@123)");
    }
    else {
        console.log("Staff user exists");
    }
    // Create sample student
    const s = await Student_1.default.findOne({ admissionNumber: "ADM2025/001" });
    if (!s) {
        const pw = await (0, hash_1.hashPassword)("John"); // firstName as password
        await Student_1.default.create({ admissionNumber: "ADM2025/001", studentId: "STD-0001", firstName: "John", lastName: "Doe", session: "2025/2026", passwordHash: pw });
        console.log("Created sample student: ADM2025/001 (password = John)");
    }
    else {
        console.log("Sample student exists");
    }
    process.exit(0);
}
seed().catch((e) => { console.error(e); process.exit(1); });
