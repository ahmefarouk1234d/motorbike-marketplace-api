import Favorite from '../models/favorite.model.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

const addFavorite = asyncHandler(async (req, res, next) => {
    const listingId = req.params.listingId;
    const userId = req.user._id;

    const favorite = await Favorite.create({ listing: listingId, user: userId });
    res.status(201).json({ success: true, data: favorite });
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