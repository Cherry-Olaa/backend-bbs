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
}

const StudentSchema = new mongoose.Schema<IStudent>({
  admissionNumber: { type: String, required: true, unique: true },
  studentId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  dob: { type: Date },
  gender: { type: String },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  session: { type: String },
  guardian: { type: Object },
  passportUrl: { type: String },
  passwordHash: { type: String, required: true },
  refreshToken: { type: String }
}, { timestamps: true });

export default mongoose.model<IStudent>("Student", StudentSchema);