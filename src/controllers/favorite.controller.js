import Favorite from '../models/favorite.model.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

const addFavorite = asyncHandler(async (req, res, next) => {
    const listingId = req.params.listingId;
    const userId = req.user._id;

    try {
        const favorite = await Favorite.create({ listing: listingId, user: userId });
        res.status(201).json({ success: true, data: favorite });
    } catch (err) {
        // The unique { user, listing } index is the real guard against duplicates.
        // Without this its raw duplicate-key error surfaces as the unhelpful
        // "This user is already in use".
        if (err.code === 11000) {
            return next(new AppError('Listing is already in your favorites', 409));
        }
        throw err;
    }
});

const getUserFavorites = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const favorites = await Favorite.find({ user: userId }).populate('listing');
    res.status(200).json({ success: true, results: favorites.length, data: favorites });
});

const removeFavorite = asyncHandler(async (req, res, next) => {
    const listingId = req.params.listingId;
    const userId = req.user._id;

    const favorite = await Favorite.findOneAndDelete({ listing: listingId, user: userId });
    if (!favorite) {
        return next(new AppError('Favorite not found', 404));
    }
    res.status(200).json({ success: true, message: 'Removed from favorites' });
});

export { addFavorite, getUserFavorites, removeFavorite };