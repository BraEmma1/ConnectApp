import express from 'express';
import "dotenv/config";
import { connectDB } from './config/db.js';




// initialize express app
const app = express();


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


