import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
const protect = asyncHandler(async (req, res, next) => {
       const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new AppError('Please authenticate', 401));
    
    }
     const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
if (!user) {
    return next(new AppError('User no longer exists', 401));
}
req.user = user;
next();

});
export default protect;