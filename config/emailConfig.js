import { createTransport } from "nodemailer";
import "dotenv/config";

export const transporter = createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    from: process.env.EMAIL_USER
});