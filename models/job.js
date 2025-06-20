import mongoose from "mongoose";


const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Job title is required'],
        maxlength: [100, 'Job title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Job description is required'],
        maxlength: [5000, 'Job description cannot exceed 5000 characters']
    },
    company: {
        type: String,
        required: [true, 'Company name is required'],
        maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    location: {
        type: String,
        required: [true, 'Job location is required'],
        maxlength: [100, 'Location cannot exceed 100 characters']
    },
    salaryRange: {
        type: String,
        required: [true, 'Salary range is required'],
        maxlength: [50, 'Salary range cannot exceed 50 characters']
    },
    jobType: {
        type: String,
        enum: ['full-time', 'part-time', 'contract', 'internship', 'temporary'],
        default: 'full-time'
    },
    requirements: {
        type: String,
        required: [true, 'Job requirements are required'],
        maxlength: [1000, 'Requirements cannot exceed 1000 characters']
    },
    responsibilities: {
        type: String,
        required: [true, 'Job responsibilities are required'],
        maxlength: [1000, 'Responsibilities cannot exceed 1000 characters']
    },
    applyUrl: {
        type: String,
        required: [true, 'Application URL is required'],
        match: [/^https?:\/\/.+/, 'URL must be a valid link']
    },
    companyLogo: {
        type: String,
        match: [/^https?:\/\/.+/, 'Company logo must be a valid link']
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    postedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });


const applicationSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    resumeUrl: {
        type: String,
        required: [true, 'Resume URL is required'],
        match: [/^https?:\/\/.+/, 'Resume URL must be a valid link']
    },
    coverLetter: {
        type: String,
        maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
    },
    status: {
        type: String,
        enum: ['applied', 'under review', 'interviewed', 'offered', 'rejected'],
        default: 'applied'
    },
    appliedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export const Job = mongoose.model('Job', jobSchema);

export const Application = mongoose.model('Application', applicationSchema);