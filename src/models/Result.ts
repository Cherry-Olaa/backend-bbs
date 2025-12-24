import mongoose, { Document } from "mongoose";

export interface IResultItem {
  subjectId: mongoose.Types.ObjectId;
  ca: number;
  exam: number;
  total: number;
  grade: string;
  comment?: string;
}

export interface IResult extends Document {
  studentId: mongoose.Types.ObjectId;
  session: string;
  term: string;
  results: IResultItem[];
  overallTotal?: number;
  average?: number;
  positionInClass?: number;
  remarks?: string;
  generatedBy?: mongoose.Types.ObjectId;
}

const ResultSchema = new mongoose.Schema<IResult>({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  session: { type: String, required: true },
  term: { type: String, required: true },
  results: [{ subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" }, ca: Number, exam: Number, total: Number, grade: String, comment: String }],
  overallTotal: Number,
  average: Number,
  positionInClass: Number,
  remarks: String,
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

ResultSchema.index({ studentId: 1, session: 1, term: 1 }, { unique: true });

export default mongoose.model<IResult>("Result", ResultSchema);