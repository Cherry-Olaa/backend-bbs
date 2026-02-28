// controllers/jobApplicationController.ts
import { Request, Response } from "express";
import Job from "../models/Job";
import JobApplication from "../models/JobApplication";
import { AuthRequest } from "../middleware/authMiddleware";
import { sendApplicationConfirmation } from "../utils/email";

// ==================== PUBLIC ROUTES ====================

// Submit application (public)
export async function submitApplication(req: Request, res: Response) {
  try {
    const { jobId, ...applicationData } = req.body;

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job || !job.isActive) {
      return res.status(404).json({ message: "Job not found or no longer accepting applications" });
    }

    // Check if deadline has passed
    if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
      return res.status(400).json({ message: "Application deadline has passed" });
    }

    // Check if already applied (prevent duplicate)
    const existingApplication = await JobApplication.findOne({
      jobId,
      email: applicationData.email
    });

    if (existingApplication) {
      return res.status(400).json({ 
        message: "You have already applied for this position" 
      });
    }

    // Handle resume upload
    let resumeUrl = '';
    if (req.file) {
      resumeUrl = req.file.path;
    }

    // Parse skills array
    let skills: string[] = [];
    if (applicationData.skills) {
      skills = typeof applicationData.skills === 'string' 
        ? applicationData.skills.split(',').map((s: string) => s.trim())
        : applicationData.skills;
    }

    const application = await JobApplication.create({
      jobId,
      ...applicationData,
      skills,
      resumeUrl
    });

    // Increment applications count on job
    await Job.findByIdAndUpdate(jobId, {
      $inc: { applicationsCount: 1 }
    });

    // Send confirmation email (optional)
    try {
      await sendApplicationConfirmation(applicationData.email, job.title);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
    }

    res.status(201).json({
      message: "Application submitted successfully",
      applicationId: application._id
    });
  } catch (error) {
    console.error("Submit application error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// ==================== ADMIN ROUTES ====================

// Get applications for a job (admin)
export async function getJobApplications(req: AuthRequest, res: Response) {
  try {
    const { jobId } = req.params;
    const { status } = req.query;

    let query: any = { jobId };
    if (status) query.status = status;

    const applications = await JobApplication.find(query)
      .sort({ createdAt: -1 });

    res.json({
      applications,
      total: applications.length
    });
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Get all applications (admin)
export async function getAllApplications(req: AuthRequest, res: Response) {
  try {
    const { status, jobId } = req.query;
    
    let query: any = {};
    if (status) query.status = status;
    if (jobId) query.jobId = jobId;

    const applications = await JobApplication.find(query)
      .populate('jobId', 'title department location')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error("Get all applications error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Get single application (admin)
export async function getApplication(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const application = await JobApplication.findById(id)
      .populate('jobId')
      .populate('reviewedBy', 'fullName username');

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json(application);
  } catch (error) {
    console.error("Get application error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Update application status (admin)
export async function updateApplicationStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const application = await JobApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.status = status;
    if (notes) application.notes = notes;
    // application.reviewedBy = req.user?.id;
    application.reviewedAt = new Date();

    await application.save();

    res.json({
      message: "Application status updated successfully",
      application
    });
  } catch (error) {
    console.error("Update application status error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Download resume (admin)
export async function downloadResume(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const application = await JobApplication.findById(id);
    if (!application || !application.resumeUrl) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Send file
    res.download(application.resumeUrl);
  } catch (error) {
    console.error("Download resume error:", error);
    res.status(500).json({ message: "Server error" });
  }
}