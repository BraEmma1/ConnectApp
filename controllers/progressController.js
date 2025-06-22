import { Progress } from '../models/progress.js';
import { Course } from '../models/course.js';
import { issueCertificate } from './certificateController.js'; // Import the certificate issuance function

// Helper function to check if all modules are completed and issue certificate
const checkAndIssueCertificate = async (userId, courseId, res) => {
    try {
        const course = await Course.findById(courseId).select('modules');
        if (!course) {
            console.warn(`Course with ID ${courseId} not found for certificate check.`);
            return;
        }

        const progress = await Progress.findOne({ user: userId, course: courseId }).select('modulesCompleted');
        if (!progress) {
            console.warn(`Progress for user ${userId} on course ${courseId} not found for certificate check.`);
            return;
        }

        // Check if the number of completed modules matches the total number of modules in the course
        if (progress.modulesCompleted.length === course.modules.length) {
            // All modules completed, issue certificate
            console.log(`All modules completed for user ${userId} in course ${courseId}. Attempting to issue certificate.`);
            // Call the issueCertificate function from certificateController
            // We need to mock req and res objects for issueCertificate
            const mockReq = { body: { userId, courseId }, user: { role: 'admin' } }; // Assuming admin role for internal call
            const mockRes = {
                status: function(code) {
                    this.statusCode = code;
                    return this;
                },
                json: function(data) {
                    this.body = data;
                    return this;
                }
            };
            await issueCertificate(mockReq, mockRes);

            if (mockRes.statusCode === 201) {
                console.log(`Certificate successfully issued for user ${userId} in course ${courseId}.`);
                // You might want to send a success response or notification here
            } else {
                console.error(`Failed to issue certificate for user ${userId} in course ${courseId}. Status: ${mockRes.statusCode}, Message: ${mockRes.body.message}`);
                // You might want to handle this failure, e.g., log it or notify an admin
            }
        }
    } catch (error) {
        console.error(`Error in checkAndIssueCertificate for user ${userId}, course ${courseId}:`, error);
    }
};

// @desc    Update user's module completion status
// @route   POST /api/progress/complete-module
// @access  Private (User)
export const updateModuleCompletion = async (req, res) => {
    const { courseId, moduleId } = req.body;
    const userId = req.user.id; // Assuming req.user is populated by auth middleware

    if (!courseId || !moduleId) {
        return res.status(400).json({ message: 'Course ID and Module ID are required.' });
    }

    try {
        // Find the course to ensure the module belongs to it
        const course = await Course.findById(courseId).select('modules');
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        const moduleExistsInCourse = course.modules.some(
            (mod) => mod._id.toString() === moduleId
        );
        if (!moduleExistsInCourse) {
            return res.status(400).json({ message: 'Module does not belong to this course.' });
        }

        let progress = await Progress.findOne({ user: userId, course: courseId });

        if (!progress) {
            // Create new progress record if none exists
            progress = await Progress.create({
                user: userId,
                course: courseId,
                modulesCompleted: [{ moduleId }]
            });
        } else {
            // Add module to completed list if not already present
            const moduleAlreadyCompleted = progress.modulesCompleted.some(
                (item) => item.moduleId.toString() === moduleId
            );

            if (!moduleAlreadyCompleted) {
                progress.modulesCompleted.push({ moduleId });
                progress.lastAccessed = Date.now();
                await progress.save();
            }
        }

        res.status(200).json({ message: 'Module completion updated successfully.', progress });

        // After updating progress, check if all modules are completed and issue certificate
        await checkAndIssueCertificate(userId, courseId, res);

    } catch (error) {
        res.status(500).json({ message: 'Server error while updating module completion.', error: error.message });
    }
};

// @desc    Get user's progress for a specific course
// @route   GET /api/progress/:courseId
// @access  Private (User)
export const getCourseProgress = async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;

    try {
        const progress = await Progress.findOne({ user: userId, course: courseId }).populate('modulesCompleted.moduleId', 'title');
        if (!progress) {
            return res.status(404).json({ message: 'Progress not found for this course.' });
        }
        res.status(200).json(progress);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching progress.', error: error.message });
    }
};

// @desc    Get all courses with user's progress summary
// @route   GET /api/progress/my-courses-progress
// @access  Private (User)
export const getMyCoursesProgress = async (req, res) => {
    const userId = req.user.id;

    try {
        const progressRecords = await Progress.find({ user: userId }).populate('course', 'title thumbnail modules');

        const summary = progressRecords.map(record => {
            const totalModules = record.course.modules.length;
            const completedModules = record.modulesCompleted.length;
            const completionPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

            return {
                course: {
                    _id: record.course._id,
                    title: record.course.title,
                    thumbnail: record.course.thumbnail,
                    totalModules: totalModules
                },
                completedModules: completedModules,
                completionPercentage: completionPercentage,
                lastAccessed: record.lastAccessed,
                _id: record._id
            };
        });

        res.status(200).json(summary);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching courses progress summary.', error: error.message });
    }
};