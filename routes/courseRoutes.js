import express from 'express';
import {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    addModuleToCourse,
    updateModuleInCourse,
    removeModuleFromCourse
} from '../controllers/courseController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { upload, uploadToCloudinary } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// A placeholder for instructor-only authorization middleware.
// The controller handles specific ownership checks, while this middleware can
// be expanded to check for a general 'instructor' role.
const instructorOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'instructor')) {
        return next();
    }
    // For update/delete, the controller will check if the user is the owner.
    if (req.user) {
        return next();
    }
    return res.status(403).json({ message: 'Not authorized' });
};

// --- Course Routes ---
router.route('/')
    .get(getAllCourses)
    .post(protect, instructorOrAdmin, upload.single('thumbnail'), uploadToCloudinary('course_thumbnails'), createCourse);

router.route('/:id')
    .get(getCourseById)
    .put(protect, instructorOrAdmin, upload.single('thumbnail'), uploadToCloudinary('course_thumbnails'), updateCourse)
    .delete(protect, instructorOrAdmin, deleteCourse);

// --- Module Routes ---
router.route('/:id/modules').post(protect, instructorOrAdmin, addModuleToCourse);

router.route('/:courseId/modules/:moduleId')
    .put(protect, instructorOrAdmin, updateModuleInCourse)
    .delete(protect, instructorOrAdmin, removeModuleFromCourse);

export const courseRouter = router;