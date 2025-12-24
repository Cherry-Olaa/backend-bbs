import { Request, Response } from "express";
import Student from "../models/Student";
import { hashPassword } from "../utils/hash";
import { v4 as uuidv4 } from "uuid";
import { AuthRequest } from "../middleware/authMiddleware";


import Result from "../models/Result";


// =======================
// CREATE STUDENT (ADMIN)
// =======================
export async function createStudent(req: Request, res: Response) {
  try {
    const { admissionNumber, firstName, lastName, dob, gender, session } = req.body;

    if (!admissionNumber || !firstName) {
      return res.status(400).json({ message: "admissionNumber & firstName required" });
    }

    const exists = await Student.findOne({ admissionNumber });
    if (exists) {
      return res.status(400).json({ message: "Admission number already exists" });
    }

    // Generate studentId + default password
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
      passwordHash,
    });

    return res.json({
      message: "Student created successfully",
      student,
      initialPassword: passwordPlain,
    });

  } catch (error) {
    console.error("Create Student Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// =======================
// GET LOGGED IN STUDENT /me
// =======================
export async function getMe(req: AuthRequest, res: Response) {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return res.status(400).json({ message: "No student ID in token" });
    }

    const student = await Student.findById(studentId).select("-passwordHash").lean();
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json(student);

  } catch (error) {
    console.error("Get Me Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// =======================
// GET STUDENT BY PARAM ID (Admin/Staff)
// =======================
export async function getStudentById(req: Request, res: Response) {
  try {
    const id = req.params.id;

    const student = await Student.findById(id).select("-passwordHash").lean();
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json(student);

  } catch (error) {
    console.error("Get Student Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// =======================
// UPDATE STUDENT
// =======================
export async function updateStudent(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const update: any = req.body;

    if (req.file) {
      update.passportUrl = req.file.path;
    }

    const student = await Student.findByIdAndUpdate(id, update, { new: true });
    return res.json(student);

  } catch (error) {
    console.error("Update Student Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// =======================
// LIST STUDENTS (Admin/Staff)
// =======================
export async function listStudents(req: Request, res: Response) {
  try {
    const { classId, session } = req.query;
    const filter: any = {};

    if (classId) filter.classId = classId;
    if (session) filter.session = session;

    const students = await Student.find(filter).limit(200).lean();
    return res.json(students);

  } catch (error) {
    console.error("List Students Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function deleteStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
  
      const student = await Student.findById(id);
      if (!student) {
        return res.status(404).json({ msg: "Student not found" });
      }
  
      // 🔥 delete all results belonging to this student
      await Result.deleteMany({ studentId: student._id });
  
      await student.deleteOne();
  
      return res.json({ msg: "Student deleted successfully" });
    } catch (err) {
      console.error("Delete student error:", err);
      return res.status(500).json({ msg: "Failed to delete student" });
    }
  }