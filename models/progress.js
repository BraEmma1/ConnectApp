import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
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
    modulesCompleted: [{
        moduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Module',
            required: true
        },
        completedAt: {
            type: Date,
            default: Date.now
        }
    }],
    lastAccessed: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export const Progress = mongoose.model('Progress', progressSchema);