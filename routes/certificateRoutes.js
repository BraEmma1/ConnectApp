import express from 'express';
import passport from 'passport';
import {
    issueCertificate,
    getMyCertificates,
    verifyCertificate,
    getCertificateById,
    revokeCertificate
} from '../controllers/certificateController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// --- Certificate Routes ---

// Admin route to issue a new certificate
router.post('/', protect, admin, issueCertificate);

// Route for a logged-in user to get all their certificates
router.get('/my-certificates', protect, getMyCertificates);

// Public route to verify a certificate's authenticity
router.get('/verify/:certificateId', verifyCertificate);

// Routes for a specific certificate by its database ID
router.route('/:id')
    .get(protect, getCertificateById)
    .delete(protect, admin, revokeCertificate);

export const certificateRouter = router;