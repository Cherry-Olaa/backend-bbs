import mongoose, { Document } from "mongoose";

export interface IUploadJob extends Document {
  uploadedBy: mongoose.Types.ObjectId;
  fileUrl: string;
  status: string;
  summary?: any;
}

const UploadJobSchema = new mongoose.Schema<IUploadJob>({
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  fileUrl: String,
  status: { type: String, default: "pending" },
  summary: Object
}, { timestamps: true });

export default mongoose.model<IUploadJob>("UploadJob", UploadJobSchema);