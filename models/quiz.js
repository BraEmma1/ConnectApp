import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'Question text is required'],
        trim: true,
        maxlength: [500, 'Question text cannot exceed 500 characters']
    },
    options: [{
        optionText: {
            type: String,
            required: [true, 'Option text is required'],
            trim: true,
            maxlength: [200, 'Option text cannot exceed 200 characters']
        },
        isCorrect: {
            type: Boolean,
            default: false
        }
    }],
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    }
});

const quizSchema = new mongoose.Schema({
   course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Quiz title is required'],
        trim: true,
        maxlength: [100, 'Quiz title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Quiz description is required'],
        maxlength: [500, 'Quiz description cannot exceed 500 characters']
    },
    questions: [questionSchema],
    totalMarks: {
        type: Number,
        default: 0
    },
    passingMarks: {
        type: Number,
        default: 0
    },
    duration: {
        type: Number, // Duration in minutes
        default: 30
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });


const  submissionSchema = new mongoose.Schema({
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answers: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: true
        },
        selectedOption: {
            type: String,
            required: true
        }
    }],
    score: {
        type: Number,
        default: 0
    },
    isPassed: {
        type: Boolean,
        default: false
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });



export const Submission = mongoose.model('Submission', submissionSchema);

export const Quiz = mongoose.model('Quiz', quizSchema);