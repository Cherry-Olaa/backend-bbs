import { Request, Response } from "express";
import User from "../models/User";
import Student from "../models/Student";
import { hashPassword } from "../utils/hash";
import { v4 as uuidv4 } from "uuid";

// create staff (admin)
export async function createStaff(req: Request, res: Response) {
  const { fullName, username, role, assignedClasses } = req.body;

  if (
    !fullName ||
    !username ||
    !role ||
    !assignedClasses ||
    !assignedClasses.length
  ) {
    return res
      .status(400)
      .json({ message: "fullName, username, role & assignedClasses required" });
  }

  const exists = await User.findOne({ username });
  if (exists) return res.status(400).json({ message: "Username exists" });

  const passwordPlain = "Staff@123";
  const passwordHash = await hashPassword(passwordPlain);

  // Generate staffId for each assigned class
  const staffIds: string[] = [];

  for (const staffClass of assignedClasses) {
    // Find last staff in this class
    const lastStaff = await User.find({ assignedClasses: { $in: [staffClass] } })
    .sort({ staffId: -1 })
    .limit(1)
    .lean();
    let nextNum = 1;

    if (lastStaff.length && lastStaff[0].staffId) {
      const lastId = lastStaff[0].staffId; // safe now
      const parts = lastId.split("/"); // ["20", "BBS", "003"]
      nextNum = parseInt(parts[2], 10) + 1;
    }

    const staffId = `${staffClass}/${String(nextNum).padStart(3, "0")}`;
    staffIds.push(staffId);
  }
  // For simplicity, assign the first staffId as primary staffId
  const user = await User.create({
    username,
    fullName,
    role,
    assignedClasses,
    staffId: staffIds[0], // primary id
    passwordHash,
  });

  res.json({
    id: user._id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    assignedClasses: user.assignedClasses,
    staffIds, // all ids for reference
    initialPassword: passwordPlain,
  });
}
// list staff (safe fields only)
export async function listStaff(req: Request, res: Response) {
  const staff = await User.find(
    { role: { $in: ["staff", "hod", "principal", "admin"] } },
    "-passwordHash -refreshToken -__v"
  ).lean();
  res.json(staff);
}

// admin creates student endpoint
export async function createStudentAdmin(req: Request, res: Response) {
  const {
    admissionNumber,
    firstName,
    lastName,
    dob,
    gender,
    session,
    classId,
  } = req.body;
  if (!admissionNumber || !firstName)
    return res
      .status(400)
      .json({ message: "admissionNumber & firstName required" });

  const exists = await Student.findOne({ admissionNumber });
  if (exists)
    return res.status(400).json({ message: "Admission number exists" });

  const studentId = `STD-${uuidv4().slice(0, 8).toUpperCase()}`;
  const passwordPlain = String(firstName).trim();
  const passwordHash = await hashPassword(passwordPlain);

  const passportUrl = req.file ? req.file.path : undefined;

  const student = await Student.create({
    admissionNumber,
    studentId,
    firstName,
    lastName,
    dob,
    gender,
    session,
    passportUrl,
    classId,
    passwordHash,
  });

  res.json({ student, initialPassword: passwordPlain });
}

// list students (admin)
export async function listStudentsAdmin(req: Request, res: Response) {
  const { classId, session } = req.query;
  const filter: any = {};
  if (classId) filter.classId = classId;
  if (session) filter.session = session;
  const students = await Student.find(filter)
    .select("-passwordHash -refreshToken -__v")
    .limit(500)
    .lean();
  res.json(students);
}
