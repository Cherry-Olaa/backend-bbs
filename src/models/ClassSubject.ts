// models/ClassSubject.ts
import mongoose from "mongoose";

const ClassSubjectSchema = new mongoose.Schema({
    className: {
        type: String, // e.g., "21/FT", "22/SCI"
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
    isCompulsory: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
});

// Ensure unique combination
ClassSubjectSchema.index({ 
    className: 1, 
    subjectId: 1, 
    academicYear: 1, 
    term: 1 
}, { 
    unique: true 
});

export default mongoose.model("ClassSubject", ClassSubjectSchema);