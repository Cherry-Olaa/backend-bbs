// controllers/jobController.ts
import { Request, Response } from "express";
import Job from "../models/Job";
import JobApplication from "../models/JobApplication";
import { AuthRequest } from "../middleware/authMiddleware";
import slugify from "slugify";

// ==================== PUBLIC ROUTES ====================

// Get all active jobs (public)
export async function getActiveJobs(req: Request, res: Response) {
  try {
    const { department, type, search } = req.query;
    
    let query: any = { isActive: true };
    
    if (department) query.department = department;
    if (type) query.type = type;
    if (search) {
      query.$text = { $search: search as string };
    }
    
    const jobs = await Job.find(query)
      .select('-createdBy -__v')
      .sort({ isUrgent: -1, createdAt: -1 })
      .limit(50);
    
    const departments = await Job.distinct('department', { isActive: true });
    
    res.json({
      jobs,
      departments,
      total: jobs.length
    });
  } catch (error) {
    console.error("Get jobs error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Get single job by slug (public)
export async function getJobBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    
    const job = await Job.findOne({ slug, isActive: true });
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    
    job.views += 1;
    await job.save();
    
    res.json(job);
  } catch (error) {
    console.error("Get job error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// ==================== ADMIN ROUTES ====================

// Helper function to process array fields
const processArrayField = (field: any): string[] => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    // If it's a JSON string, parse it
    if (field.startsWith('[') && field.endsWith(']')) {
      try {
        return JSON.parse(field);
      } catch (e) {
        return field.split(',').map((item: string) => item.trim());
      }
    }
    // Otherwise split by commas
    return field.split(',').map((item: string) => item.trim());
  }
  return [];
};

// Create job (admin)
export async function createJob(req: AuthRequest, res: Response) {
  try {
    const { 
      title, department, location, type, experience,
      description, requirements, responsibilities, benefits,
      salary, applicationDeadline, isUrgent 
    } = req.body;

    console.log("Creating job with data:", { title, department, requirements }); // Debug log

    // Generate slug from title
    const slug = slugify(title, { lower: true, strict: true });
    
    // Check if slug exists
    const existingJob = await Job.findOne({ slug });
    if (existingJob) {
      return res.status(400).json({ message: "Job with similar title already exists" });
    }

    // Process array fields
    const processedRequirements = processArrayField(requirements);
    const processedResponsibilities = processArrayField(responsibilities);
    const processedBenefits = processArrayField(benefits);

    // Process salary
    let processedSalary = salary;
    if (salary && typeof salary === 'string') {
      try {
        processedSalary = JSON.parse(salary);
      } catch (e) {
        processedSalary = undefined;
      }
    }

    const job = await Job.create({
      title,
      slug,
      department,
      location,
      type,
      experience,
      description,
      requirements: processedRequirements,
      responsibilities: processedResponsibilities,
      benefits: processedBenefits,
      salary: processedSalary,
      applicationDeadline,
      isUrgent: isUrgent === 'true' || isUrgent === true,
      createdBy: req.user?.id
    });

    res.status(201).json({
      message: "Job created successfully",
      job
    });
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Get all jobs (admin)
export async function getAllJobs(req: AuthRequest, res: Response) {
  try {
    const { status, department } = req.query;
    
    let query: any = {};
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (department) query.department = department;
    
    const jobs = await Job.find(query)
      .populate('createdBy', 'fullName username')
      .sort({ createdAt: -1 });
    
    res.json(jobs);
  } catch (error) {
    console.error("Get all jobs error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Update job (admin)
export async function updateJob(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log("Updating job:", { id, updates }); // Debug log

    // If title is updated, update slug too
    if (updates.title) {
      updates.slug = slugify(updates.title, { lower: true, strict: true });
      
      // Check if new slug conflicts with another job
      const existingJob = await Job.findOne({ 
        slug: updates.slug,
        _id: { $ne: id }
      });
      if (existingJob) {
        return res.status(400).json({ message: "Job with similar title already exists" });
      }
    }

    // Process array fields if they exist in updates
    if (updates.requirements !== undefined) {
      updates.requirements = processArrayField(updates.requirements);
    }
    if (updates.responsibilities !== undefined) {
      updates.responsibilities = processArrayField(updates.responsibilities);
    }
    if (updates.benefits !== undefined) {
      updates.benefits = processArrayField(updates.benefits);
    }

    // Process salary if it exists
    if (updates.salary !== undefined) {
      if (typeof updates.salary === 'string') {
        try {
          updates.salary = JSON.parse(updates.salary);
        } catch (e) {
          updates.salary = undefined;
        }
      }
    }

    const job = await Job.findByIdAndUpdate(
      id, 
      updates, 
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({
      message: "Job updated successfully",
      job
    });
  } catch (error) {
    console.error("Update job error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Delete job (admin)
export async function deleteJob(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    // Check if there are applications
    const applicationsCount = await JobApplication.countDocuments({ jobId: id });
    
    if (applicationsCount > 0) {
      return res.status(400).json({ 
        message: "Cannot delete job with existing applications. Consider closing it instead." 
      });
    }

    const job = await Job.findByIdAndDelete(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Delete job error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Toggle job status (active/inactive)
export async function toggleJobStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    job.isActive = !job.isActive;
    await job.save();

    res.json({ 
      message: `Job ${job.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: job.isActive
    });
  } catch (error) {
    console.error("Toggle job status error:", error);
    res.status(500).json({ message: "Server error" });
  }
}


// controllers/jobController.ts - Add this function

// Get single job by ID (admin)
export async function getJobById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const job = await Job.findById(id)
        .populate('createdBy', 'fullName username');
        
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json(job);
    } catch (error) {
      console.error("Get job by ID error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }