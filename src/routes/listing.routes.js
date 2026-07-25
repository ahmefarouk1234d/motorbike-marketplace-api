import express from 'express';
import { createListing, getAllListings, getListing, updateListing, deleteListing, updateListingStatus } from '../controllers/listing.controller.js';
import protect from '../middleware/auth.js';
import optionalAuth from '../middleware/optionalAuth.js';
import authorize from '../middleware/authorize.js';
import checkOwnership from '../middleware/checkOwnership.js';
import Listing from '../models/listing.model.js';
import validate from '../middleware/validate.js';
import { uploadListingImages } from '../middleware/upload.js';
import { createListingSchema, updateListingSchema } from '../validators/listing.validator.js';

const router = express.Router();

// optionalAuth so these stay public, while admins and owners can still see
// listings that are not approved yet.
router.get('/', optionalAuth, getAllListings);
router.get('/:id', optionalAuth, getListing);
// uploadListingImages runs before validate: express.json() does not touch
// multipart bodies, so multer is what populates req.body for these routes.
// checkOwnership stays ahead of it so a 403 is returned before anything is
// uploaded to Firebase.
router.post('/', protect, authorize('seller', 'admin'), uploadListingImages, validate(createListingSchema), createListing);
router.patch('/:id', protect, checkOwnership(Listing), uploadListingImages, validate(updateListingSchema), updateListing);
router.delete('/:id', protect, checkOwnership(Listing), deleteListing);
router.patch('/:id/status', protect, authorize('admin'), updateListingStatus);

export default router;