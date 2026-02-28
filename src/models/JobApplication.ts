// models/JobApplication.ts
import mongoose, { Document } from "mongoose";

export interface IJobApplication extends Document {
  jobId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  resumeUrl: string;
  coverLetter?: string;
  portfolio?: string;
  linkedIn?: string;
  experience: string;
  education: string;
  skills: string[];
  expectedSalary?: number;
  startDate?: Date;
  heardFrom?: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  notes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JobApplicationSchema = new mongoose.Schema<IJobApplication>({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: String,
  city: String,
  state: String,
  country: { type: String, default: 'Nigeria' },
  resumeUrl: { type: String, required: true },
  coverLetter: String,
  portfolio: String,
  linkedIn: String,
  experience: { type: String, required: true },
  education: { type: String, required: true },
  skills: [{ type: String }],
  expectedSalary: Number,
  startDate: Date,
  heardFrom: String,
  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'],
    default: 'pending'
  },
  notes: String,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: Date
}, { timestamps: true });

// Index for searching applications
JobApplicationSchema.index({ email: 1, jobId: 1 });
JobApplicationSchema.index({ status: 1 });

export default mongoose.model<IJobApplication>("JobApplication", JobApplicationSchema);