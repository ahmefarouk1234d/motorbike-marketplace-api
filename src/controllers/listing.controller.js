import Listing from '../models/listing.model.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import APIFeatures from '../utils/APIFeatures.js';
import { uploadFiles, deleteFiles } from '../utils/storage.js';

const LISTING_FILTERS = ['brand', 'model', 'city', 'condition', 'status', 'seller', 'year', 'price', 'engineCC', 'mileage'];

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
        await deleteFiles(images.map((image) => image.path));
        throw err;
    }
});

const getAllListings = asyncHandler(async (req, res, next) => {
    const isAdmin = req.user?.role === 'admin';

    const queryString = { ...req.query };
    if (!isAdmin) delete queryString.status;

    const features = new APIFeatures(Listing.find(), queryString, LISTING_FILTERS)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    if (!isAdmin) features.query = features.query.find({ status: 'approved' });

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

    if (listing.status !== 'approved') {
        const isAdmin = req.user?.role === 'admin';
        const isOwner = req.user && listing.seller?._id?.toString() === req.user._id.toString();
        if (!isAdmin && !isOwner) {
            return next(new AppError('Listing not found', 404));
        }
    }

    const isOwnListing = req.user && listing.seller?._id?.toString() === req.user._id.toString();
    if (!isOwnListing) {
        await Listing.updateOne({ _id: listing._id }, { $inc: { viewsCount: 1 } });
        listing.viewsCount += 1;
    }

    res.status(200).json({ success: true, data: listing });
});

const updateListing = asyncHandler(async (req, res, next) => {
    const listing = req.resource;
    const uploaded = req.files?.length ? await uploadFiles(req.files, 'listings') : [];
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

    const listing = await Listing.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after', runValidators: true });
    if (!listing) {
        return next(new AppError('Listing not found', 404));
    }
    res.status(200).json({ success: true, data: listing });
});
export { createListing, getAllListings, getListing, updateListing, deleteListing, updateListingStatus };