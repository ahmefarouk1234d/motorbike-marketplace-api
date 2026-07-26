import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import asyncHandler from '../utils/asyncHandler.js';

const optionalAuth = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) req.user = user;
    } catch {
    }

    next();
});

export default optionalAuth;
