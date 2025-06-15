import mongoose from 'mongoose';


const userProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
    },

    profile: {
        profilePicture: {
            url: String,
            publicId: String
        },
        dateOfBirth: Date,
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
        },
        location: {
            region: String,
            city: String,
            address: String
        },
        bio: {
            type: String,
            maxlength: [500, 'Bio cannot exceed 500 characters']
        },

        // Education
        education: [{
            institution: {
                type: String,
                required: true
            },
            degree: {
                type: String,
                required: true
            },
            fieldOfStudy: String,
            startDate: Date,
            endDate: Date,
            isCurrently: {
                type: Boolean,
                default: false
            },
            grade: String,
            description: String
        }],

        // Skills
        skills: [{
            name: {
                type: String,
                required: true
            },
            level: {
                type: String,
                enum: ['beginner', 'intermediate', 'advanced', 'expert'],
                default: 'intermediate'
            }
        }],

        // Experience
        experience: [{
            title: {
                type: String,
                required: true
            },
            company: {
                type: String,
                required: true
            },
            location: String,
            startDate: {
                type: Date,
                required: true
            },
            endDate: Date,
            isCurrently: {
                type: Boolean,
                default: false
            },
            description: String,
            type: {
                type: String,
                enum: ['internship', 'part-time', 'full-time', 'contract', 'volunteer'],
                default: 'internship'
            }
        }],

        // CV/Resume
        cv: {
            url: String,
            publicId: String,
            uploadDate: {
                type: Date,
                default: Date.now
            }
        },

        // Preferences
        jobPreferences: {
            jobTypes: [{
                type: String,
                enum: ['internship', 'entry-level', 'national-service', 'part-time', 'contract']
            }],
            industries: [String],
            locations: [String],
            salaryRange: {
                min: Number,
                max: Number
            },
            availability: {
                type: String,
                enum: ['immediate', '1-week', '2-weeks', '1-month', '3-months'],
                default: 'immediate'
            }
        }
    },

    // Notification Preferences
    notifications: {
        email: {
            jobAlerts: {
                type: Boolean,
                default: true
            },
            applicationUpdates: {
                type: Boolean,
                default: true
            },
            newsletter: {
                type: Boolean,
                default: false
            }
        },
        sms: {
            jobAlerts: {
                type: Boolean,
                default: false
            },
            applicationUpdates: {
                type: Boolean,
                default: true
            }
        }
    },
})
export const UserProfile = mongoose.model('UserProfile', userProfileSchema);