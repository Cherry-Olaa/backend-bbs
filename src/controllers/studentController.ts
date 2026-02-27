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

// If you're NOT using passport upload, you can simplify:
export async function updateStudent(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { 
      firstName, 
      lastName, 
      admissionNumber,
      dob, 
      gender, 
      session, 
      classId 
    } = req.body;

    console.log("Updating student:", { id, firstName, lastName, admissionNumber });

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check admission number uniqueness
    if (admissionNumber && admissionNumber !== student.admissionNumber) {
      const existingStudent = await Student.findOne({ admissionNumber });
      if (existingStudent) {
        return res.status(400).json({ message: "Admission number already exists" });
      }
    }

    // Update fields
    if (firstName !== undefined) student.firstName = firstName;
    if (lastName !== undefined) student.lastName = lastName;
    if (admissionNumber !== undefined) student.admissionNumber = admissionNumber;
    if (dob !== undefined) student.dob = dob ? new Date(dob) : undefined;
    if (gender !== undefined) student.gender = gender;
    if (session !== undefined) student.session = session;
    if (classId !== undefined) student.classId = classId;

    await student.save();

    const studentData = student.toObject();

    delete studentData.refreshToken;

    return res.json({
      message: "Student updated successfully",
      student: studentData
    });

  } catch (error) {
    console.error("Update Student Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
// Add this to studentController.ts
export async function getStudentByAdmission(req: Request, res: Response) {
  try {
    const { admissionNumber } = req.query;

    if (!admissionNumber) {
      return res.status(400).json({ message: "Admission number is required" });
    }

    const student = await Student.findOne({ 
      admissionNumber: admissionNumber 
    }).select("_id firstName lastName admissionNumber session").lean();

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json(student);

  } catch (error) {
    console.error("Get Student By Admission Error:", error);
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



// =======================
// DEACTIVATE STUDENT (soft delete)
// =======================
export async function deactivateStudent(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if already deactivated
    if (!student.isActive) {
      return res.status(400).json({ message: "Student is already deactivated" });
    }

    student.isActive = false;
    student.deactivatedAt = new Date();
    await student.save();

    return res.json({
      message: "Student deactivated successfully",
      student: {
        _id: student._id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        isActive: student.isActive
      }
    });

  } catch (error) {
    console.error("Deactivate Student Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// =======================
// REACTIVATE STUDENT
// =======================
export async function reactivateStudent(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if already active
    if (student.isActive) {
      return res.status(400).json({ message: "Student is already active" });
    }

    student.isActive = true;
    student.deactivatedAt = undefined;
    await student.save();

    return res.json({
      message: "Student reactivated successfully",
      student: {
        _id: student._id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        isActive: student.isActive
      }
    });

  } catch (error) {
    console.error("Reactivate Student Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// =======================
// GET ACTIVE STUDENTS ONLY (modified listStudents)
// =======================
export async function listActiveStudents(req: Request, res: Response) {
  try {
    const { classId, session, showInactive } = req.query;
    const filter: any = {};

    // By default, only show active students
    if (showInactive !== 'true') {
      filter.isActive = true;
    }

    if (classId) filter.classId = classId;
    if (session) filter.session = session;

    const students = await Student.find(filter)
      .select("-passwordHash")
      .limit(200)
      .sort({ firstName: 1 })
      .lean();

    // Add status field for frontend
    const studentsWithStatus = students.map(s => ({
      ...s,
      status: s.isActive ? 'Active' : 'Inactive'
    }));

    return res.json(studentsWithStatus);

  } catch (error) {
    console.error("List Students Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// =======================
// GET ALL STUDENTS (including inactive) - Admin only
// =======================
export async function listAllStudents(req: Request, res: Response) {
  try {
    const { classId, session } = req.query;
    const filter: any = {};

    if (classId) filter.classId = classId;
    if (session) filter.session = session;

    const students = await Student.find(filter)
      .select("-passwordHash")
      .limit(200)
      .sort({ firstName: 1 })
      .lean();

    const studentsWithStatus = students.map(s => ({
      ...s,
      status: s.isActive ? 'Active' : 'Inactive'
    }));

    return res.json(studentsWithStatus);

  } catch (error) {
    console.error("List All Students Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// =======================
// MODIFIED DELETE STUDENT (hard delete - keep for admin)
// =======================
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


