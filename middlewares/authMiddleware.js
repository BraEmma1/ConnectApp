import jwt from 'jsonwebtoken';


const Token_expiration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
export const generateAuthToken = (res, user) => {
    const payload = {
        id: user._id,
        role: user.role
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: Token_expiration
    });
    res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        expires: new Date(Date.now() + Token_expiration)// Set cookie expiration to match token expiration
    });

    return token;
}

export const authenticateUser = (req, res, next) => {
    // Check if the token is present in the  cookies
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized access No Token provided' });
    }
    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Attach user information to the request object
        req.user = decoded;
        next();

    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(401).json({ message: 'Unauthorized access Invalid Token' });
    }
};