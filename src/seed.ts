import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "./config/config";
import User from "./models/User";
import Student from "./models/Student";
import { hashPassword } from "./utils/hash";

async function seed() {
  await connectDB();

  // Create super admin if not exists
  const adminUser = await User.findOne({ username: "admin" });
  if (!adminUser) {
    const passwordHash = await hashPassword("Admin@123");
    await User.create({ username: "admin", passwordHash, fullName: "Super Admin", role: "admin" });
    console.log("Created admin user: admin (Admin@123)");
  } else {
    console.log("Admin user exists");
  }

  // Create sample staff if not exists
  const staffUser = await User.findOne({ username: "teacher1@busybrains" });
  if (!staffUser) {
    const passwordHash = await hashPassword("Staff@123");
    await User.create({ username: "teacher1@busybrains", passwordHash, fullName: "Teacher One", role: "staff" });
    console.log("Created staff user: teacher1@busybrains (Staff@123)");
  } else {
    console.log("Staff user exists");
  }

  // Create sample student
  const s = await Student.findOne({ admissionNumber: "ADM2025/001" });
  if (!s) {
    const pw = await hashPassword("John"); // firstName as password
    await Student.create({ admissionNumber: "ADM2025/001", studentId: "STD-0001", firstName: "John", lastName: "Doe", session: "2025/2026", passwordHash: pw });
    console.log("Created sample student: ADM2025/001 (password = John)");
  } else {
    console.log("Sample student exists");
  }

  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });