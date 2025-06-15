import { Router } from "express";
import { forgetPassword, loginUser, logoutUser, registerUser, resetPassword, verifyUserEmail, } from "../controllers/authController.js";

export const authRouter = Router();

authRouter.post('/auth/register', registerUser);

authRouter.post('/auth/verify-email', verifyUserEmail);


authRouter.post('/auth/login', loginUser);

authRouter.post('/auth/logout', logoutUser);

authRouter.post("/auth/forget-password", forgetPassword);   

authRouter.post("/auth/reset-password/:resetToken", resetPassword);