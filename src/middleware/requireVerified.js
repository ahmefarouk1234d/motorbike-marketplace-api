import AppError from '../utils/AppError.js';

const requireVerified = (req, res, next) => {
    if (!req.user.isVerified) {
        return next(new AppError('Please verify your email before publishing a listing', 403));
    }
    next();
};

export default requireVerified;