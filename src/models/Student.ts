// import mongoose, { Document } from "mongoose";

// export interface IStudent extends Document {
//   admissionNumber: string;
//   studentId: string;
//   firstName: string;
//   lastName?: string;
//   dob?: Date;
//   gender?: string;
//   classId?: string; // instead of ObjectId
//   session?: string;
//   guardian?: { name?: string; phone?: string; email?: string };
//   passportUrl?: string;
//   passwordHash: string;
//   refreshToken?: string | null;
// }

// const StudentSchema = new mongoose.Schema<IStudent>({
//   admissionNumber: { type: String, required: true, unique: true },
//   studentId: { type: String, required: true, unique: true },
//   firstName: { type: String, required: true },
//   lastName: { type: String },
//   dob: { type: Date },
//   gender: { type: String },
//   classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
//   session: { type: String },
//   guardian: { type: Object },
//   passportUrl: { type: String },
//   passwordHash: { type: String, required: true },
//   refreshToken: { type: String }
// }, { timestamps: true });

// export default mongoose.model<IStudent>("Student", StudentSchema);
// models/Student.ts
// models/Student.ts
import mongoose, { Document } from "mongoose";

export interface IStudent extends Document {
  admissionNumber: string;
  studentId: string;
  firstName: string;
  lastName?: string;
  dob?: Date;
  gender?: string;
  classId?: string; // instead of ObjectId
  session?: string;
  guardian?: { name?: string; phone?: string; email?: string };
  passportUrl?: string;
  passwordHash: string;
  refreshToken?: string | null;
  isActive: boolean;
  deactivatedAt?: Date;
}

const StudentSchema = new mongoose.Schema<IStudent>({
  admissionNumber: { type: String, required: true, unique: true },
  studentId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  dob: { type: Date },
  gender: { type: String },
  // ✅ FIX: Change from ObjectId to String to match your data
  classId: { type: String }, 
  session: { type: String },
  guardian: { type: Object },
  passportUrl: { type: String },
  passwordHash: { type: String, required: true },
  refreshToken: { type: String },
  isActive: { type: Boolean, default: true },
  deactivatedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model<IStudent>("Student", StudentSchema);