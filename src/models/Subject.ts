import mongoose, { Document } from "mongoose";

export interface ISubject extends Document {
  code: string;
  name: string;
}

const SubjectSchema = new mongoose.Schema<ISubject>({
  code: { type: String, required: true, uppercase: true, unique: true },
  name: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<ISubject>("Subject", SubjectSchema);