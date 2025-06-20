import mongoose from 'mongoose';


const userSchema = new mongoose.Schema({
    // Basic Information
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        required: function() {
            return !this.googleId;
        },
        match: [/^(\+233|233|0)(20|23|24|26|27|28|50|54|55|56|57|59)\d{7}$/, 'Please enter a valid Ghana phone number']
    },
    profilePicture: {   
        type: String,
        default: 'https://res.cloudinary.com/dz4qj1x8h/image/upload/v1709300000/default-profile-picture.png'
    },
    password: {
        type: String,  
        required: function() {      
            return !this.googleId; 
        },
        minlength: [8, 'Password must be at least 8 characters'],
    },

age: {
        type: Number,
        min: [12, 'You must be at least 12 years old'],
        max: [120, 'Age cannot exceed 120 years']
    },
      interests: {
        type: [String],
        default: []
    },

 language: {
        type: String,
        enum: ['English', 'Twi', 'Ewe', 'Hausa', 'Other'],
        default: 'English'
    },
referralCode: {
        type: String,
        unique: true,
        sparse: true // Add this to allow multiple nulls but enforce uniqueness for actual values
    },
  referredBy: {
        type: String
    },
    // User Role
    role: {
        type: String,
        enum: ['user', 'jobseeker', 'employer', 'admin'],
        default: 'user'
    },
profile: {
      type: mongoose.Schema.Types.ObjectId,
              ref: 'UserProfile',
        default: null
    },
    // Account Status
    isActive: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        default: Date.now()
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
        default: null
    },
    verificationTokenExpiry: {
        type: Date,
        default: null
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    phoneVerificationCode: String,
    phoneVerificationExpires: Date,

    profileCompleteness: {
        type: Number,
        default: 20 // After basic registration
    },

    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordTokenExpiry: {
        type: Date,
        default: null
    },
    googleId: { 
        type: String,
        unique: true,
        sparse: true 
    }


}, {
    timestamps: true
});
// Virtual field to get full name
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});
export const User = mongoose.model('User', userSchema);