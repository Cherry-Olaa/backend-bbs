// models/Result.ts
import mongoose, { Document } from "mongoose";

export interface IResultItem {
  subjectId: mongoose.Types.ObjectId;
  classWork: number;     // 10% max
  homeWork: number;      // 10% max
  ca: number;            // 20% max
  exam: number;          // 60% max
  total: number;         // classWork + homeWork + ca + exam (max 100)
  grade: string;
  comment?: string;
}

export interface IResult extends Document {
  studentId: mongoose.Types.ObjectId;
  session: string;
  term: string;
  results: IResultItem[];
  overallTotal?: number;        // Sum of all subject totals
  average?: number;              // Overall average across subjects
  positionInClass?: number;
  remarks?: string;
  generatedBy?: mongoose.Types.ObjectId;
}

const ResultItemSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  classWork: { type: Number, required: true, min: 0, max: 10 },
  homeWork: { type: Number, required: true, min: 0, max: 10 },
  ca: { type: Number, required: true, min: 0, max: 20 },
  exam: { type: Number, required: true, min: 0, max: 60 },
  total: { type: Number, required: true, min: 0, max: 100 },
  grade: { type: String, required: true },
  comment: { type: String }
});

const ResultSchema = new mongoose.Schema<IResult>({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  session: { type: String, required: true },
  term: { type: String, required: true, enum: ["First", "Second", "Third"] },
  results: [ResultItemSchema],
  overallTotal: { type: Number },
  average: { type: Number },
  positionInClass: { type: Number },
  remarks: { type: String },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

// Unique constraint: one document per student per term
ResultSchema.index({ studentId: 1, session: 1, term: 1 }, { unique: true });

export default mongoose.model<IResult>("Result", ResultSchema);