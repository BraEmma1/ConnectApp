import { Router } from 'express';
import {  getMyProfile, updateMyProfile,deleteMyProfile, getUserProfileById, getUserProfileByUserId,
} from '../controllers/userProfileController.js';
import { authenticateUser } from '../middlewares/authMiddleware.js'; 

export const userProfileRouter = Router();
// Routes for the authenticated user's own profile
// These routes require the user to be logged in (authenticateUser middleware)
userProfileRouter.route('/me')
    .get(authenticateUser, getMyProfile) // GET /api/userprofiles/me
    .put(authenticateUser, updateMyProfile) // PUT /api/userprofiles/me
    .delete(authenticateUser, deleteMyProfile); // DELETE /api/userprofiles/me

// Routes for fetching other user profiles (potentially admin-only)

// Add authorization checks inside the controller functions (e.g., check req.user.role)

 userProfileRouter.route('/:id').get(authenticateUser, getUserProfileById); // GET /api/userprofiles/:id
userProfileRouter.route('/user/:userId').get(authenticateUser, getUserProfileByUserId); // GET /api/userprofiles/user/:userId

// Note: createUserProfile is typically called internally, not via a direct API POST route.
// If you need a public profile creation route, you would add:
// userProfileRouter.post('/', createUserProfile); // But this would need different logic (e.g., getting userId from body or params)