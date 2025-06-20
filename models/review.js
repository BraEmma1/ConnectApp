import mongoose from "mongoose";


const reviewSchema = new mongoose.Schema({
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
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export const Review = mongoose.model('Review', reviewSchema);