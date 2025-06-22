import express from 'express';
import "dotenv/config";
import { connectDB } from './config/db.js';
import { authRouter } from './routes/authRoutes.js';
import { referralRouter } from './routes/referralRoutes.js';
import { certificateRouter } from './routes/certificateRoutes.js'; // Import the new router
import { progressRouter } from './routes/progressRoutes.js'; // Import the new router
import { courseRouter } from './routes/courseRoutes.js'; // Import the new router
import { configurePassport } from './config/passport.js';
import cookieParser from 'cookie-parser';
import { userProfileRouter } from './routes/userProfileRoutes.js'; // Import the new router
import passport from 'passport';




// initialize express app
const app = express();


// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser()); // Add cookie parser middleware

// Passport configuration
configurePassport();
app.use(passport.initialize());


//Initialize Routes

app.use('/api/courses', courseRouter); // Mount the course router
app.use('/api/progress', progressRouter); // Mount the progress router
app.use('/api/certificates', certificateRouter); // Mount the certificate router
app.use('/api/referrals', referralRouter); // Mount the referral router
app.use('/api/userprofiles', userProfileRouter); // Mount the user profile router
app.use(authRouter);




const PORT = process.env.PORT || 3000;
// Connect to Database
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on ${PORT}`);
        })
    })
    .catch((err) => {
        console.log(err);
        process.exit(1); // Exit process with failure
    });
