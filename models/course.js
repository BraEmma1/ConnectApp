import mongoose from "mongoose";







// Course Model
const moduleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Module title is required'],
        trim: true,
        maxlength: [100, 'Module title cannot exceed 100 characters']
    },
    type: {
        type: String,
        enum: ['Video', 'Article', 'Quiz', 'Assignment'],
        required: [true, 'Module type is required']
    },
    url: {
        type: String,
        required: function () {
            return this.type === 'Video' || this.type === 'Article';
        },
        match: [/^https?:\/\/.+/, 'URL must be a valid link']
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Course title is required'],
        trim: true,
        maxlength: [100, 'Course title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Course description is required'],
        maxlength: [500, 'Course description cannot exceed 500 characters']
    },
    category: {
        type: String,
        required: [true, 'Course category is required'],
        enum: ['Technology', 'Business', 'Arts', 'Science', 'Health', 'Other']
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner'
    },
    price: {
        type: Number,
        required: [true, 'Course price is required'],
        min: [0, 'Price cannot be negative']
    },
    thumbnail: {
        type: String,
        required: [true, 'Course thumbnail is required'],
        match: [/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/, 'Thumbnail must be a valid image URL']
    },
    duration: {
        type: String,
        required: [true, 'Course duration is required'],
        match: [/^\d+\s(hours|days|weeks|months)$/, 'Duration must be in the format "X hours/days/weeks/months"']
    },
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Instructor ID is required']
    },
    modules: [moduleSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Course = mongoose.model('Course', courseSchema);