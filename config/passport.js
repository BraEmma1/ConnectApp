
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/userModel.js';
import { createUserProfile } from '../controllers/userProfileController.js';
import "dotenv/config";

export const configurePassport = () => {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL, // e.g., "/auth/google/callback" relative to your domain

        scope: ['profile', 'email'] // Ensure this matches the scope in your route
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
                if (!email) {
                    return done(new Error("Email not found in Google profile"), false);
                }

                let user = await User.findOne({ email: email });

                if (user) {
                    // User exists, update if necessary
                    user.googleId = profile.id;
                    if (profile.photos && profile.photos.length > 0) {
                        user.profilePicture = profile.photos[0].value;
                    }
                    user.lastLogin = Date.now();
                    await user.save();
                    return done(null, user);
                } else {
                    // User does not exist, create a new one
                    const newUser = new User({
                        googleId: profile.id,
                        email: email,
                        firstName: profile.name.givenName || profile.displayName.split(' ')[0],
                        lastName: profile.name.familyName || profile.displayName.split(' ').slice(1).join(' ') || '',
                        isEmailVerified: true, // Email from Google is considered verified
                        profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
                        // Password field can be left empty or handled as per your User schema requirements
                        // for OAuth-only users.
                    });
                    await newUser.save();

                    // Optionally, you can create a user profile here if you have a separate UserProfile model
                    if (newUser) {
                        try {
                            await createUserProfile(newUser._id);
                        } catch (profileError) {
                            console.error(`Failed to create profile for Google user ${newUser._id}:`, profileError.message);
                            // Log and continue
                        }
                    }
                    return done(null, newUser);
                }
            } catch (error) {
                return done(error, false);
            }
        }));


};

// //Passport Google Strategy
// export const configurePassport = () => {
//     passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL:process.env.GOOGLE_CALLBACK_URL,
//     passReqToCallback:true,

//   },(request,accessToken,refreshToken,profile,done )=> {
//     return done(null,profile);
//   }));

// //   Serialize user into session
// passport.serializeUser((user,done) =>{
//     done(null,user);
// });

// //   Deserialize user from session
// passport.deserializeUser((user,done) =>{
//     done(null,user);
// });
// };