import { Course } from '../models/course.js';

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private/Admin/Instructor
export const createCourse = async (req, res) => {
    const { title, description, category, level, price, duration } = req.body;

    // The thumbnail URL is now provided by our uploadToCloudinary middleware
    const thumbnail = req.cloudinaryUrl;
    if (!thumbnail) {
        return res.status(400).json({ message: 'Course thumbnail image is required.' });
    }

    try {
        // The instructor is the currently logged-in user
        const instructorId = req.user.id;

        const course = new Course({
            title,
            description,
            category,
            level,
            price,
            thumbnail,
            duration,
            instructorId
        });

        const createdCourse = await course.save();
        res.status(201).json(createdCourse);
    } catch (error) {
        res.status(400).json({ message: 'Error creating course', error: error.message });
    }
};

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
export const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find({}).populate('instructorId', 'firstName lastName');
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get a single course by ID
// @route   GET /api/courses/:id
// @access  Public
export const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('instructorId', 'firstName lastName');
        if (course) {
            res.status(200).json(course);
        } else {
            res.status(404).json({ message: 'Course not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private/Admin/Instructor
export const updateCourse = async (req, res) => {
    const { title, description, category, level, price, duration } = req.body;

    // A new thumbnail URL will only exist if a new file was uploaded
    const newThumbnail = req.cloudinaryUrl;

    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if the user is the instructor or an admin
        if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'User not authorized to update this course' });
        }

        course.title = title || course.title;
        course.description = description || course.description;
        course.category = category || course.category;
        course.level = level || course.level;
        course.price = price ?? course.price;
        course.thumbnail = newThumbnail || course.thumbnail; // Use new thumbnail if uploaded, otherwise keep the old one
        course.duration = duration || course.duration;

        const updatedCourse = await course.save();
        res.status(200).json(updatedCourse);
    } catch (error) {
        res.status(400).json({ message: 'Error updating course', error: error.message });
    }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private/Admin/Instructor
export const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if the user is the instructor or an admin
        if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'User not authorized to delete this course' });
        }

        await course.deleteOne();
        res.status(200).json({ message: 'Course removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- Module Controllers ---

// @desc    Add a module to a course
// @route   POST /api/courses/:id/modules
// @access  Private/Admin/Instructor
export const addModuleToCourse = async (req, res) => {
    const { title, type, url } = req.body;

    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'User not authorized to add modules to this course' });
        }

        const newModule = { title, type, url };

        course.modules.push(newModule);
        await course.save();
        res.status(201).json(course.modules[course.modules.length - 1]);
    } catch (error) {
        res.status(400).json({ message: 'Error adding module', error: error.message });
    }
};

// @desc    Update a module in a course
// @route   PUT /api/courses/:courseId/modules/:moduleId
// @access  Private/Admin/Instructor
export const updateModuleInCourse = async (req, res) => {
    const { title, type, url } = req.body;

    try {
        const course = await Course.findById(req.params.courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'User not authorized to update modules in this course' });
        }

        const module = course.modules.id(req.params.moduleId);

        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        module.title = title || module.title;
        module.type = type || module.type;
        module.url = url || module.url;

        await course.save();
        res.status(200).json(module);
    } catch (error) {
        res.status(400).json({ message: 'Error updating module', error: error.message });
    }
};

// @desc    Remove a module from a course
// @route   DELETE /api/courses/:courseId/modules/:moduleId
// @access  Private/Admin/Instructor
export const removeModuleFromCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'User not authorized to remove modules from this course' });
        }

        const module = course.modules.id(req.params.moduleId);

        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        await module.deleteOne();
        await course.save();

        res.status(200).json({ message: 'Module removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};