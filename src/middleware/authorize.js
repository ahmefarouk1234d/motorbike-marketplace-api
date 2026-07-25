import AppError from '../utils/AppError.js';
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You are not authorized to perform this action', 403));
        }
        next();
    };
};
export default authorize;