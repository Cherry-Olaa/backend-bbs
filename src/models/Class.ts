import mongoose, { Document } from "mongoose";

export interface IClass extends Document {
  name: string;
  level: string;
  arm?: string;
  subjects?: mongoose.Types.ObjectId[];
  teacherIds?: mongoose.Types.ObjectId[];
}

const ClassSchema = new mongoose.Schema<IClass>({
  name: { type: String, required: true },
  level: { type: String, required: true },
  arm: { type: String },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
  teacherIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

export default mongoose.model<IClass>("Class", ClassSchema);