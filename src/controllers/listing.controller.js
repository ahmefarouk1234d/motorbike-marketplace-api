import Listing from '../models/listing.model.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import APIFeatures from '../utils/APIFeatures.js';
import { uploadFiles, deleteFiles } from '../utils/storage.js';

const createListing = asyncHandler(async (req, res, next) => {
    const images = req.files?.length ? await uploadFiles(req.files, 'listings') : [];

    try {
        const listing = await Listing.create({
            ...req.body,
            images,
            seller: req.user._id
        });
        res.status(201).json({ success: true, data: listing });
    } catch (err) {
        // The files are already in the bucket by this point. If the document
        // fails to save they would be orphaned with nothing pointing at them,
        // so clean up before letting the error reach the handler.
        await deleteFiles(images.map((image) => image.path));
        throw err;
    }
});

const getAllListings = asyncHandler(async (req, res, next) => {
    const features = new APIFeatures(Listing.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const listings = await features.query
        .populate('brand', 'name logo')
        .populate('seller', 'fullName email');

    res.status(200).json({
        success: true,
        results: listings.length,
        data: listings
    });
});

const getListing = asyncHandler(async (req, res, next) => {
    const listing = await Listing.findById(req.params.id)
        .populate('brand', 'name logo')
        .populate('seller', 'fullName email');
    if (!listing) {
        return next(new AppError('Listing not found', 404));
    }
    res.status(200).json({ success: true, data: listing });
});

const updateListing = asyncHandler(async (req, res, next) => {
    // checkOwnership has already loaded and authorised this document.
    const listing = req.resource;
    const uploaded = req.files?.length ? await uploadFiles(req.files, 'listings') : [];
    // Uploading images replaces the existing set rather than appending, which
    // keeps the result predictable and respects the five-image cap.
    const superseded = uploaded.length ? listing.images.map((image) => image.path) : [];

    Object.assign(listing, req.body);
    if (uploaded.length) listing.images = uploaded;

    try {
        await listing.save();
    } catch (err) {
        await deleteFiles(uploaded.map((image) => image.path));
        throw err;
    }

    await listing.populate([
        { path: 'brand', select: 'name logo' },
        { path: 'seller', select: 'fullName email' }
    ]);

    // Old files go only after the new ones are safely persisted.
    await deleteFiles(superseded);

    res.status(200).json({ success: true, data: listing });
});

const deleteListing = asyncHandler(async (req, res, next) => {
    const listing = await Listing.findByIdAndDelete(req.params.id);
    if (!listing) {
        return next(new AppError('Listing not found', 404));
    }
    await deleteFiles(listing.images.map((image) => image.path));
    res.status(200).json({ success: true, data: listing });
});
const updateListingStatus = asyncHandler(async (req, res, next) => {
    const { status } = req.body;
       if (!['approved', 'rejected'].includes(status)) {
        return next(new AppError('Status must be either approved or rejected', 400));
    }

    const listing = await Listing.findByIdAndUpdate(req.params.id, { status }, { new: true ,runValidators: true});
    if (!listing) {
        return next(new AppError('Listing not found', 404));
    }
    res.status(200).json({ success: true, data: listing });
});
export { createListing, getAllListings, getListing, updateListing, deleteListing, updateListingStatus };