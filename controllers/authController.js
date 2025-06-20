import bcrypt from "bcryptjs";
import { User } from "../models/userModel.js";
import { Referral } from "../models/referral.js" // Import Referral model
import { sendPasswordResetEmail, sendPasswordResetSuccessEmail, sendVerificationEmail, sendWelcomeEmail } from "../utils/emailService.js";
import userValidationSchema from "../validation_schema/userValidation.js";
import { generateAuthToken } from "../middlewares/authMiddleware.js";
import { createUserProfile } from "./userProfileController.js";
import passport from "passport";

// Register a new user
export const registerUser = async (req, res) => {
    try {
        //validate user input with joi schema
        const { error, value } = userValidationSchema.validate(req.body, { abortEarly: false });

        if (error) {

            return res.status(400).json({ message: error.details.map(err => err.message) });
        }
        // Check if user already exists
        const email = value.email.toLowerCase(); // Convert to lowercase for consistent checking
        const userExists = await User.findOne({ email: email }); // Use the lowercased email
        if (userExists) {
            return res.status(400).json({ success: false, message: "User with this email already exists." });
        }

        let referralCode = null;
        if(value.referredBy){
            const referredByUser = await User.findOne({ referralCode: value.referredBy });
            if(!referredByUser){
              return res.status(400).json({ success: false, message: "Invalid referral code." });
            }
                // Create a new Referral record
        const newReferral = await Referral.create({
            referrer: referredByUser._id, // Assuming `_id` is the user ID field
            referredUser: newUser._id,
            referralCode
        });
    
        // Add the generated referral code to the new user
        referralCode = newReferral.referralCode;
    }

        // Hash the password
        value.password = await bcrypt.hash(value.password, 10);
        //generate a verification token
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        // Create a new user
        try {
            const newUser = await User.create({
                ...value,
                referralCode,
                email: email, // Ensure the lowercased email from the check is used for creation
                verificationToken,
                verificationTokenExpiry: Date.now() + 3600000 // 1 hour
            });

            // Create a user profile
            if (newUser) {
                try {
                    const userProfile = await createUserProfile(newUser._id); // Pass the new user's ID
                    if (userProfile) {
                        newUser.profile = userProfile._id; // Link profile to user
                        await newUser.save(); // Save the user again to store the profile link
                    }
                } catch (profileError) {
                    console.error(`Failed to create profile for user ${newUser._id}:`, profileError.message);
                    // Decide if this error is critical enough to affect user registration response
                }
            }

            // TODO: Send verification email/SMS with the token
            try {
                sendVerificationEmail(newUser.email, verificationToken);
            } catch (emailError) {
                console.error("Error sending verification email:", emailError.message)

            }
            return res.status(201).json({
                success: true,
                message: "User registered successfully.",
                user: {
                    ...newUser._doc,
                    password: undefined,
                }
            });

        } catch (error) {
            if (error.code === 11000) {
                // Log the actual field that caused the duplicate error
                console.error("Duplicate key error:", error.keyValue);
                let duplicateFieldMessage = "An account with this email already exists.";
                if (error.keyValue && error.keyValue.referralCode) {
                    duplicateFieldMessage = "This referral code is already in use.";
                }
                return res.status(400).json({ success: false, message: duplicateFieldMessage });
            } throw error;
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
        console.log(error);
    }
}

// Verify user email
export const verifyUserEmail = async (req, res) => {
    try {
        const { code } = req.body;

        // Find the user by email and verification token
        const user = await User.findOne({ verificationToken: code, verificationTokenExpiry: { $gt: Date.now() } });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired  verification Code" });
        }


        // Update the user's verified status and clear the verification token
        user.isEmailVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiry = undefined;
        await user.save();

        // Send welcome email
        try {
            await sendWelcomeEmail(user.email, user.firstName, "Skill Link");
            res.status(200).json({ success: true, message: "Email verified successfully. Welcome email sent." });
        } catch (emailError) {
            console.error("Error sending welcome email:", emailError.message);
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid  email credentials " });
        }

        // Check if the password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }
        // Generate authentication token
        const token = generateAuthToken(res, user);


        // update the last login time
        user.lastLogin = Date.now();
        await user.save();

        // Send response
        res.status(200).json({
            success: true,
            message: "Login successful",

        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
        console.log(error);
    }
};

// forget password 
export const forgetPassword = async (req, res) => {
    const { email } = req.body;
    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }
        // Generate a password reset token

        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordToken = resetToken;
        user.resetPasswordTokenExpiry = Date.now() + 3600000; // 1 hour
        await user.save();
        // Send password reset email        
        try {
            await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);
            res.status(200).json({ success: true, message: "Password reset email sent" });
        } catch (emailError) {
            console.error("Error sending password reset email:", emailError.message);
            res.status(500).json({ success: false, message: "Failed to send password reset email" });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
        console.log(error);
    }


}

export const resetPassword = async (req, res) => {
    const { newPassword } = req.body;
    const { resetToken } = req.params;
    try {
        // Find the user by reset token
        const user = await User.findOne({
            resetPasswordToken: resetToken,
            resetPasswordTokenExpiry: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
        }
        // Hash the new password
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpiry = undefined;
        await user.save();
        // Send success email
        try {
            await sendPasswordResetSuccessEmail(user.email);
            res.status(200).json({ success: true, message: "Password reset successful. A confirmation email has been sent." });
        } catch (emailError) {
            console.error("Error sending password reset success email:", emailError.message);
            res.status(500).json({ success: false, message: "Failed to send password reset success email" });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
        console.log(error);
    }
}

export const logoutUser = async (req, res) => {
    try {
        // Clear the authentication token
        res.clearCookie("authToken");
        res.status(200).json({ success: true, message: "Logout successful" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const googleAuth = (req, res, next) => {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
};

export const googleAuthCallback = (req, res, next) => {
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=google_auth_failed` }, (err, user, info) => {
        if (err || !user) {
            // Log the error or info for debugging
            console.error("Google authentication error:", err, info);
            return res.redirect(`${process.env.FAILED_URL || 'http://localhost:3000'}?error=google_auth_failed`);
        }
        // Now, generate your JWT and set it as a cookie.
        generateAuthToken(res, user);

        return res.redirect(process.env.SUCCESS_URL || 'http://localhost:3000');

    })(req, res, next); // Important: call the middleware function returned by passport.authenticate
};

export const loginFailed = (req, res) => {
    res.status(401).json({ success: false, message: "Login failed" });
}
// Google login success handler
export const googleLoginSuccess = (req, res) => {
    const user = req.user;
    const profilePictureUrl = user.profilePicture || 'https://res.cloudinary.com/dz4qj1x8h/image/upload/v1709300000/default-profile-picture.png'; // Fallback to default if undefined
    const htmlResponse = `
        <h1>Hello, ${user.firstName || user.fullName}! Welcome!</h1>
        <p>Here's your profile picture:</p>
        <img src="${profilePictureUrl}" alt="Profile Picture" style="width:100px; height:100px; border-radius:50%;">
    `;
    res.send(htmlResponse);
};

// Google user logout handler
export const userLogout = (req, res, next) => { // Added next for error handling consistency
    req.logout((err) => {
        if (err) {
            console.error("Error during Google user logout:", err);
            // Pass to error handler or send response directly
            return res.status(500).json({ success: false, message: "Logout failed" });
        }

        res.clearCookie("authToken");
        res.status(200).json({ success: true, message: "User logged out successfully" });
    });
}
