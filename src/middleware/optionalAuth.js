import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import asyncHandler from '../utils/asyncHandler.js';

// Attaches req.user when a valid token is present, but never rejects the request.
// Public endpoints use this to widen what they return for admins and owners
// without forcing every visitor to authenticate.
const optionalAuth = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) req.user = user;
    } catch {
        // On a public route a bad token is simply treated as no token.
    }

    next();
});

export default optionalAuth;
