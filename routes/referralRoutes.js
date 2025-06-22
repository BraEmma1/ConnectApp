import express from 'express';
import passport from 'passport';
import {
    createReferral,
    getMyReferrals,
    getAllReferrals,
    getReferralById,
    updateReferralStatus,
    getMyReferralCode // Import the new controller function
} from '../controllers/referralController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// --- Referral Routes ---

router.route('/')
    .post(protect, admin, createReferral) // Example: Only admins can manually create referrals
    .get(protect, admin, getAllReferrals);

// Route for a user to get their list of successful referrals
router.get('/my-referrals', protect, getMyReferrals);

// Route for a user to get their own referral code to share
router.get('/my-code', protect, getMyReferralCode);

router.route('/:id')
    .get(protect, admin, getReferralById)
    .patch(protect, admin, updateReferralStatus);

export const referralRouter = router;