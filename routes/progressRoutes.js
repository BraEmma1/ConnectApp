import express from 'express';
import { protect } from '../middlewares/authMiddleware.js'; // Assuming protect middleware is in authMiddleware.js
import {
    updateModuleCompletion,
    getCourseProgress,
    getMyCoursesProgress
} from '../controllers/progressController.js';

const router = express.Router();

// All routes in this file require authentication
router.use(protect);

// @route   POST /api/progress/complete-module
// @desc    Update user's module completion status
router.post('/complete-module', updateModuleCompletion);

// @route   GET /api/progress/:courseId
// @desc    Get user's progress for a specific course
router.get('/:courseId', getCourseProgress);

// @route   GET /api/progress/my-courses-progress
// @desc    Get all courses with user's progress summary
router.get('/my-courses-progress', getMyCoursesProgress);

export const progressRouter = router;