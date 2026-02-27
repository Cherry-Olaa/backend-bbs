// models/SubjectRegistration.ts
import mongoose from "mongoose";

const SubjectRegistrationSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true
    },
    academicYear: {
        type: String,
        required: true
    },
    term: {
        type: String,
        enum: ["First", "Second", "Third"],
        required: true
    },
    class: {
        type: String, // e.g., "21/FT"
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
});

// Prevent duplicate registrations
SubjectRegistrationSchema.index({ 
    studentId: 1, 
    subjectId: 1, 
    academicYear: 1, 
    term: 1 
}, { 
    unique: true 
});

export default mongoose.model("SubjectRegistration", SubjectRegistrationSchema);