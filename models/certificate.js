import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    issuedAt: {
        type: Date,
        default: Date.now
    },
    certificateUrl: {
        type: String,
        required: true,
        match: [/^https?:\/\/.+/, 'Certificate URL must be a valid link']
    },
    certificateId: {
        type: String,
        unique: true,
        required: true
    }
}, { timestamps: true });

export const Certificate = mongoose.model('Certificate', certificateSchema);