// import mongoose from "mongoose";
// import { Request, Response } from "express";
// import Job from "../models/Job";
// import JobApplication from "../models/JobApplication";
// import { AuthRequest } from "../middleware/authMiddleware";
// import { sendApplicationConfirmation } from "../utils/email";
// // ==================== PUBLIC ROUTES ====================

// // Submit application (public)
// export async function submitApplication(req: Request, res: Response) {
//   try {
//     const { jobId, ...applicationData } = req.body;

//     console.log("Received application data:", { jobId, ...applicationData });

//     // Check if job exists and is active
//     const job = await Job.findById(jobId);
//     if (!job || !job.isActive) {
//       return res.status(404).json({ message: "Job not found or no longer accepting applications" });
//     }

//     // Check if deadline has passed
//     if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
//       return res.status(400).json({ message: "Application deadline has passed" });
//     }

//     // Check if already applied (prevent duplicate)
//     const existingApplication = await JobApplication.findOne({
//       jobId,
//       email: applicationData.email
//     });

//     if (existingApplication) {
//       return res.status(400).json({ 
//         message: "You have already applied for this position" 
//       });
//     }

//     // Handle resume upload
//     let resumeUrl = '';
//     if (req.file) {
//       resumeUrl = req.file.path;
//     }

//     // Parse array fields (they come as JSON strings from frontend)
//     const parseArrayField = (field: any): string[] => {
//       if (!field) return [];
//       if (Array.isArray(field)) return field;
//       if (typeof field === 'string') {
//         try {
//           return JSON.parse(field);
//         } catch (e) {
//           // If not JSON, split by commas
//           return field.split(',').map((item: string) => item.trim());
//         }
//       }
//       return [];
//     };

//     // Parse skills (comma-separated string)
//     let skills: string[] = [];
//     if (applicationData.skills) {
//       skills = typeof applicationData.skills === 'string' 
//         ? applicationData.skills.split(',').map((s: string) => s.trim())
//         : applicationData.skills;
//     }

//     // Parse array fields
//     const institutions = parseArrayField(applicationData.institutions);
//     const subjectsTaught = parseArrayField(applicationData.subjectsTaught);
//     const keyStrengths = parseArrayField(applicationData.keyStrengths);

//     // Validate required fields
//     if (!applicationData.firstName || !applicationData.lastName || !applicationData.email || !applicationData.phone) {
//       return res.status(400).json({ message: "Missing required personal information fields" });
//     }

//     if (!applicationData.education || !applicationData.courseOfStudy || institutions.length === 0) {
//       return res.status(400).json({ message: "Missing required education fields" });
//     }

//     if (!applicationData.workExperience || subjectsTaught.length === 0) {
//       return res.status(400).json({ message: "Missing required professional experience fields" });
//     }

//     if (!applicationData.trcnCertification || keyStrengths.length === 0) {
//       return res.status(400).json({ message: "Missing required professional qualification fields" });
//     }

//     const application = await JobApplication.create({
//       jobId,
//       firstName: applicationData.firstName,
//       lastName: applicationData.lastName,
//       email: applicationData.email,
//       phone: applicationData.phone,
//       address: applicationData.address,
      
//       // Education
//       education: applicationData.education,
//       courseOfStudy: applicationData.courseOfStudy,
//       institutions,
      
//       // Professional Experience
//       workExperience: applicationData.workExperience,
//       previousSchool: applicationData.previousSchool,
//       subjectsTaught,
      
//       // Professional Qualifications
//       trcnCertification: applicationData.trcnCertification,
//       keyStrengths,
      
//       // Additional Info
//       skills,
//       coverLetter: applicationData.coverLetter,
//       portfolio: applicationData.portfolio,
//       linkedIn: applicationData.linkedIn,
      
//       // Resume
//       resumeUrl
//     });

//     // Increment applications count on job
//     await Job.findByIdAndUpdate(jobId, {
//       $inc: { applicationsCount: 1 }
//     });

//     // Send confirmation email
//     try {
//       await sendApplicationConfirmation(applicationData.email, job.title);
//     } catch (emailError) {
//       console.error("Failed to send confirmation email:", emailError);
//     }

//     res.status(201).json({
//       message: "Application submitted successfully",
//       applicationId: application._id
//     });
//   } catch (error) {
//     console.error("Submit application error:", error);
//     res.status(500).json({ 
//       message: "Server error",
//       error: error instanceof Error ? error.message : "Unknown error"
//     });
//   }
// }

// // ==================== ADMIN ROUTES ====================

// // Get applications for a job (admin)
// export async function getJobApplications(req: AuthRequest, res: Response) {
//   try {
//     const { jobId } = req.params;
//     const { status } = req.query;

//     let query: any = { jobId };
//     if (status) query.status = status;

//     const applications = await JobApplication.find(query)
//       .sort({ createdAt: -1 });

//     res.json({
//       applications,
//       total: applications.length
//     });
//   } catch (error) {
//     console.error("Get applications error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// }

// // Get all applications (admin)
// export async function getAllApplications(req: AuthRequest, res: Response) {
//   try {
//     const { status, jobId, education, workExperience, trcnCertification } = req.query;
    
//     let query: any = {};
//     if (status) query.status = status;
//     if (jobId) query.jobId = jobId;
//     if (education) query.education = education;
//     if (workExperience) query.workExperience = workExperience;
//     if (trcnCertification) query.trcnCertification = trcnCertification;

//     const applications = await JobApplication.find(query)
//       .populate('jobId', 'title department location')
//       .sort({ createdAt: -1 });

//     res.json(applications);
//   } catch (error) {
//     console.error("Get all applications error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// }

// // Get single application (admin)
// export async function getApplication(req: AuthRequest, res: Response) {
//   try {
//     const { id } = req.params;

//     const application = await JobApplication.findById(id)
//       .populate('jobId')
//       .populate('reviewedBy', 'fullName username');

//     if (!application) {
//       return res.status(404).json({ message: "Application not found" });
//     }

//     res.json(application);
//   } catch (error) {
//     console.error("Get application error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// }

// // Update application status (admin)
// export async function updateApplicationStatus(req: AuthRequest, res: Response) {
//   try {
//     const { id } = req.params;
//     const { status, notes } = req.body;

//     const application = await JobApplication.findById(id);
//     if (!application) {
//       return res.status(404).json({ message: "Application not found" });
//     }

//     application.status = status;
//     if (notes) application.notes = notes;
    
//     // Fix: Check if req.user exists before accessing id
//     if (req.user && req.user.id) {
//       application.reviewedBy = new mongoose.Types.ObjectId(req.user.id);
//     }
    
//     application.reviewedAt = new Date();

//     await application.save();

//     res.json({
//       message: "Application status updated successfully",
//       application
//     });
//   } catch (error) {
//     console.error("Update application status error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// }

// // Download resume (admin)
// export async function downloadResume(req: AuthRequest, res: Response) {
//   try {
//     const { id } = req.params;

//     const application = await JobApplication.findById(id);
//     if (!application || !application.resumeUrl) {
//       return res.status(404).json({ message: "Resume not found" });
//     }

//     // Send file
//     res.download(application.resumeUrl);
//   } catch (error) {
//     console.error("Download resume error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// }
// controllers/jobApplicationController.ts
import mongoose from "mongoose";
import { Request, Response } from "express";
import Job from "../models/Job";
import JobApplication from "../models/JobApplication";
import { AuthRequest } from "../middleware/authMiddleware";
import { sendApplicationConfirmation, sendApplicationStatusEmail } from "../utils/email";

// ==================== PUBLIC ROUTES ====================

// Submit application (public)
export async function submitApplication(req: Request, res: Response) {
  try {
    const { jobId, ...applicationData } = req.body;

    console.log("Received application data:", { jobId, ...applicationData });

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

    // Parse array fields (they come as JSON strings from frontend)
    const parseArrayField = (field: any): string[] => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch (e) {
          // If not JSON, split by commas
          return field.split(',').map((item: string) => item.trim());
        }
      }
      return [];
    };

    // Parse skills (comma-separated string)
    let skills: string[] = [];
    if (applicationData.skills) {
      skills = typeof applicationData.skills === 'string' 
        ? applicationData.skills.split(',').map((s: string) => s.trim())
        : applicationData.skills;
    }

    // Parse array fields
    const institutions = parseArrayField(applicationData.institutions);
    const subjectsTaught = parseArrayField(applicationData.subjectsTaught);
    const keyStrengths = parseArrayField(applicationData.keyStrengths);

    // Validate required fields
    if (!applicationData.firstName || !applicationData.lastName || !applicationData.email || !applicationData.phone) {
      return res.status(400).json({ message: "Missing required personal information fields" });
    }

    if (!applicationData.education || !applicationData.courseOfStudy || institutions.length === 0) {
      return res.status(400).json({ message: "Missing required education fields" });
    }

    if (!applicationData.workExperience || subjectsTaught.length === 0) {
      return res.status(400).json({ message: "Missing required professional experience fields" });
    }

    if (!applicationData.trcnCertification || keyStrengths.length === 0) {
      return res.status(400).json({ message: "Missing required professional qualification fields" });
    }

    const application = await JobApplication.create({
      jobId,
      firstName: applicationData.firstName,
      lastName: applicationData.lastName,
      email: applicationData.email,
      phone: applicationData.phone,
      address: applicationData.address,
      
      // Education
      education: applicationData.education,
      courseOfStudy: applicationData.courseOfStudy,
      institutions,
      
      // Professional Experience
      workExperience: applicationData.workExperience,
      previousSchool: applicationData.previousSchool,
      subjectsTaught,
      
      // Professional Qualifications
      trcnCertification: applicationData.trcnCertification,
      keyStrengths,
      
      // Additional Info
      skills,
      coverLetter: applicationData.coverLetter,
      portfolio: applicationData.portfolio,
      linkedIn: applicationData.linkedIn,
      
      // Resume
      resumeUrl
    });

    // Increment applications count on job
    await Job.findByIdAndUpdate(jobId, {
      $inc: { applicationsCount: 1 }
    });

    // Send confirmation email (asynchronous - don't await to not block response)
    sendApplicationConfirmation(
      applicationData.email, 
      job.title, 
      `${applicationData.firstName} ${applicationData.lastName}`
    ).catch(err => console.error("Failed to send confirmation email:", err));

    res.status(201).json({
      message: "Application submitted successfully",
      applicationId: application._id
    });
  } catch (error) {
    console.error("Submit application error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
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
    const { status, jobId, education, workExperience, trcnCertification } = req.query;
    
    let query: any = {};
    if (status) query.status = status;
    if (jobId) query.jobId = jobId;
    if (education) query.education = education;
    if (workExperience) query.workExperience = workExperience;
    if (trcnCertification) query.trcnCertification = trcnCertification;

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

// Update application status (admin) - WITH EMAIL NOTIFICATIONS
export async function updateApplicationStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const application = await JobApplication.findById(id).populate('jobId', 'title');
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const oldStatus = application.status;
    const jobTitle = (application.jobId as any)?.title || 'the position';
    const applicantName = `${application.firstName} ${application.lastName}`;

    // Update the application
    application.status = status;
    if (notes) application.notes = notes;
    
    if (req.user && req.user.id) {
      application.reviewedBy = new mongoose.Types.ObjectId(req.user.id);
    }
    
    application.reviewedAt = new Date();
    await application.save();

    // Define which statuses should trigger emails
    const emailTriggers: Record<string, boolean> = {
      'shortlisted': true,
      'rejected': true,
      'hired': true,
      'reviewed': false, // Set to true if you want emails for reviewed status
    };

    // Send email notification if status should trigger email
    if (emailTriggers[status] && oldStatus !== status) {
      // Don't await - send asynchronously to not block response
      sendApplicationStatusEmail(
        application.email,
        applicantName,
        jobTitle,
        status as 'reviewed' | 'shortlisted' | 'rejected' | 'hired',
        notes || undefined
      ).then(sent => {
        if (sent) {
          console.log(`✅ ${status} email sent to ${application.email}`);
        } else {
          console.log(`❌ Failed to send ${status} email to ${application.email}`);
        }
      }).catch(err => {
        console.error(`Error sending ${status} email:`, err);
      });
    }

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