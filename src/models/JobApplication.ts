// models/JobApplication.ts
import mongoose, { Document } from "mongoose";

export interface IJobApplication extends Document {
  jobId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  resumeUrl: string;
  coverLetter?: string;
  portfolio?: string;
  linkedIn?: string;
  
  // New fields
  education: string;
  courseOfStudy: string;
  institutions: string[];
  workExperience: string;
  previousSchool?: string;
  subjectsTaught: string[];
  trcnCertification: string;
  keyStrengths: string[];
  skills: string[];
  
  // Optional fields
  expectedSalary?: number;
  startDate?: Date;
  heardFrom?: string;
  
  // Status fields
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  notes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JobApplicationSchema = new mongoose.Schema<IJobApplication>({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  
  // Basic Info
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
  
  // Education
  education: { type: String, required: true },
  courseOfStudy: { type: String, required: true },
  institutions: [{ type: String, required: true }],
  
  // Professional Experience
  workExperience: { type: String, required: true },
  previousSchool: { type: String },
  subjectsTaught: [{ type: String, required: true }],
  
  // Professional Qualifications
  trcnCertification: { type: String, required: true },
  keyStrengths: [{ type: String, required: true }],
  
  // Additional Info
  skills: [{ type: String }],
  coverLetter: { type: String },
  portfolio: { type: String },
  linkedIn: { type: String },
  
  // Files
  resumeUrl: { type: String, required: true },
  
  // Optional Fields
  expectedSalary: Number,
  startDate: Date,
  heardFrom: String,
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'],
    default: 'pending'
  },
  notes: String,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: Date
}, { timestamps: true });

// Indexes for searching
JobApplicationSchema.index({ email: 1, jobId: 1 });
JobApplicationSchema.index({ status: 1 });
JobApplicationSchema.index({ education: 1 });
JobApplicationSchema.index({ workExperience: 1 });
JobApplicationSchema.index({ trcnCertification: 1 });

export default mongoose.model<IJobApplication>("JobApplication", JobApplicationSchema);