// models/Job.ts
import mongoose, { Document } from "mongoose";

export interface IJob extends Document {
  title: string;
  slug: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  experience: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits?: string[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  applicationDeadline?: Date;
  isActive: boolean;
  isUrgent: boolean;
  views: number;
  applicationsCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new mongoose.Schema<IJob>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  location: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    required: true 
  },
  experience: { type: String, required: true },
  description: { type: String, required: true },
  requirements: [{ type: String, required: true }],
  responsibilities: [{ type: String, required: true }],
  benefits: [{ type: String }],
  salary: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'NGN' }
  },
  applicationDeadline: Date,
  isActive: { type: Boolean, default: true },
  isUrgent: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  applicationsCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

// Index for search
JobSchema.index({ title: 'text', description: 'text', department: 'text' });

export default mongoose.model<IJob>("Job", JobSchema);