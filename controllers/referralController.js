import { Referral } from '../models/referral.js';
import { User } from '../models/userModel.js';
import crypto from 'crypto';




const generateReferralCode = async() => {
    let code;
let isUnique = false;
while (!isUnique) {
    code = crypto.randomBytes(4).toString('hex').toUpperCase();
    // Check if the code already exists in the database
    const existingUser = await User.findOne({ referralCode: code });
    if (!existingUser) {
        isUnique = true;
    }
}
return code;
}
// @desc    Create a new referral
// @route   POST /api/referrals
// @access  Private (e.g., Admin or triggered by system on user signup)
export const createReferral = async (req, res) => {
    const { referredUserId, referralCode } = req.body;

    try {
        const referrer = await User.findOne({ referralCode });
        if (!referrer) {
            return res.status(404).json({ message: 'Referrer with this code not found.' });
        }

        const referredUser = await User.findById(referredUserId);
        if (!referredUser) {
            return res.status(404).json({ message: 'Referred user not found.' });
        }

        // The unique index on referredUser in the schema will handle this check,
        // but an explicit check provides a clearer error message.
        const existingReferral = await Referral.findOne({ referredUser: referredUserId });
        if (existingReferral) {
            return res.status(400).json({ message: 'This user has already been referred.' });
        }

        const referral = await Referral.create({
            referrer: referrer._id,
            referredUser: referredUserId,
            referralCode,
            status: 'pending' // Or 'approved' right away, depending on business logic
        });

        res.status(201).json(referral);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'This user has already been referred.' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all referrals for the logged-in user
// @route   GET /api/referrals/my-referrals
// @access  Private
export const getMyReferrals = async (req, res) => {
    try {
        // Assuming req.user is populated by auth middleware
        const referrals = await Referral.find({ referrer: req.user.id }).populate('referredUser', 'firstName lastName email');
        res.status(200).json(referrals);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all referrals (admin)
// @route   GET /api/referrals
// @access  Private/Admin
export const getAllReferrals = async (req, res) => {
    try {
        const referrals = await Referral.find({}).populate('referrer', 'fullName email').populate('referredUser', 'fullName email');
        res.status(200).json(referrals);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get a single referral by ID
// @route   GET /api/referrals/:id
// @access  Private/Admin
export const getReferralById = async (req, res) => {
    try {
        const referral = await Referral.findById(req.params.id).populate('referrer', 'firstName  lastName email').populate('referredUser', 'firstName lastName email');
        if (!referral) {
            return res.status(404).json({ message: 'Referral not found' });
        }
        res.status(200).json(referral);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update referral status
// @route   PATCH /api/referrals/:id
// @access  Private/Admin
export const updateReferralStatus = async (req, res) => {
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status.' });
    }

    try {
        const referral = await Referral.findByIdAndUpdate(req.params.id, { status }, { new: true });

        if (!referral) {
            return res.status(404).json({ message: 'Referral not found' });
        }

        // If the status is 'approved', award the referrer
        if (status === 'approved') {
            // Award the referrer (e.g., credit points, unlock features, etc.)
            const referrer = await User.findById(referral.referrer);
            if (referrer) {
                referrer.points += 10; // Assuming you have a points field
                await referrer.save();
            }
        }


        res.status(200).json(referral);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get the logged-in user's referral code
// @route   GET /api/referrals/my-code
// @access  Private
export const getMyReferralCode = async (req, res) => {
    try {
        // req.user is populated by the passport 'jwt' middleware and contains the user's ID.
        const user = await User.findById(req.user.id).select('referralCode');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (!user.referralCode) {
            // This might happen if referral codes were introduced after some users had already signed up.
            user.referralCode = await generateReferralCode();
            await user.save();
        }

        res.status(200).json({ referralCode: user.referralCode });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};