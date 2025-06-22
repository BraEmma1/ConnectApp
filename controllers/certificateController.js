import { Certificate } from '../models/certificate.js';
import { User } from '../models/userModel.js';
import { Course } from '../models/course.js';
import crypto from 'crypto';

// Helper to generate a unique, public-facing certificate ID
const generateUniqueCertificateId = async () => {
    let id;
    let isUnique = false;
    while (!isUnique) {
        // Generate a more readable and professional-looking ID
        id = `CERT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
        const existingCert = await Certificate.findOne({ certificateId: id });
        if (!existingCert) {
            isUnique = true;
        }
    }
    return id;
};

// @desc    Issue a new certificate (e.g., upon course completion)
// @route   POST /api/certificates
// @access  Private/Admin
export const issueCertificate = async (req, res) => {
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
        return res.status(400).json({ message: 'User ID and Course ID are required.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // Prevent issuing duplicate certificates for the same user and course
        const existingCertificate = await Certificate.findOne({ user: userId, course: courseId });
        if (existingCertificate) {
            return res.status(400).json({ message: 'A certificate for this user and course has already been issued.' });
        }

        const certificateId = await generateUniqueCertificateId();
        // In a real application, this URL would point to a generated PDF or a verification page.
        const certificateUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-certificate/${certificateId}`;

        const certificate = await Certificate.create({
            user: userId,
            course: courseId,
            certificateId,
            certificateUrl
        });

        // TODO: Optionally, send an email notification to the user.
        // await sendCertificateEmail(user.email, user.firstName, course.title, certificateUrl);

        res.status(201).json(certificate);
    } catch (error) {
        res.status(500).json({ message: 'Server error while issuing certificate.', error: error.message });
    }
};

// @desc    Get all certificates for the logged-in user
// @route   GET /api/certificates/my-certificates
// @access  Private
export const getMyCertificates = async (req, res) => {
    try {
        const certificates = await Certificate.find({ user: req.user.id })
            .populate('course', 'title thumbnail')
            .sort({ issuedAt: -1 });
        res.status(200).json(certificates);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Verify a certificate by its public ID
// @route   GET /api/certificates/verify/:certificateId
// @access  Public
export const verifyCertificate = async (req, res) => {
    try {
        const certificate = await Certificate.findOne({ certificateId: req.params.certificateId })
            .populate('user', 'firstName lastName')
            .populate('course', 'title');

        if (!certificate) {
            return res.status(404).json({ isValid: false, message: 'Certificate not found or invalid.' });
        }

        res.status(200).json({
            isValid: true,
            message: 'Certificate is valid.',
            details: {
                recipientName: certificate.user.fullName,
                courseName: certificate.course.title,
                issuedAt: certificate.issuedAt,
                certificateId: certificate.certificateId
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get a single certificate by its database ID
// @route   GET /api/certificates/:id
// @access  Private
export const getCertificateById = async (req, res) => {
    try {
        const certificate = await Certificate.findById(req.params.id).populate('user', 'fullName email').populate('course', 'title');

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found.' });
        }

        // Authorization: Allow access only to the certificate owner or an admin
        if (certificate.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view this certificate.' });
        }

        res.status(200).json(certificate);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Revoke (delete) a certificate
// @route   DELETE /api/certificates/:id
// @access  Private/Admin
export const revokeCertificate = async (req, res) => {
    try {
        const certificate = await Certificate.findByIdAndDelete(req.params.id);

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found.' });
        }

        res.status(200).json({ message: 'Certificate revoked successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};