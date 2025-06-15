import bcrypt from "bcryptjs";
import { User } from "../models/userModel.js";
import { sendPasswordResetEmail, sendPasswordResetSuccessEmail, sendVerificationEmail, sendWelcomeEmail } from "../utils/emailService.js";
import userValidationSchema from "../validation_schema/userValidation.js";
import { generateAuthToken } from "../middlewares/authMiddleware.js";


// Register a new user
export const registerUser = async (req, res) => {
    try {
        //validate user input with joi schema
        const { error, value } = userValidationSchema.validate(req.body, { abortEarly: false });

        if (error) {

            return res.status(400).json({ message: error.details.map(err => err.message) });
        }
        // Check if user already exists
        const email = value.email;
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        value.password = await bcrypt.hash(value.password, 10);
        //generate a verification token
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        // Create a new user
        try {
            const newUser = await User.create({
                ...value,
                verificationToken,
                verificationTokenExpiry: Date.now() + 3600000 // 1 hour
            });

            // TODO: Send verification email/SMS with the token
            try {
                sendVerificationEmail(newUser.email, verificationToken);
            } catch (emailError) {
                console.error("Error sending verification email:", emailerror.message)

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
                return res.status(400).json({ success: false, message: "An account with this email or phone number already exists." });
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
        generateAuthToken(res, user);

        console.log(generateAuthToken(res, user));
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