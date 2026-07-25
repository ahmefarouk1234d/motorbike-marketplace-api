import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

const checkOwnership = (Model, ownerField = 'seller') =>
    asyncHandler(async (req, res, next) => {
        const resource = await Model.findById(req.params.id);
        if (!resource) {
            return next(new AppError('Resource not found', 404));
        }

        const isOwner = resource[ownerField].toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAdmin) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }

        req.resource = resource;
        next();
    });

export default checkOwnership;