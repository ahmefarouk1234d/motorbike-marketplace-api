import express from 'express';
import { getAllBrands, getBrand, createBrand, updateBrand, deleteBrand } from '../controllers/brand.controller.js';
import protect from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { uploadBrandLogo } from '../middleware/upload.js';
import { createBrandSchema, updateBrandSchema } from '../validators/brand.validator.js';

const router = express.Router();

router.route('/')
    .get(getAllBrands)
    .post(protect, authorize('admin'), uploadBrandLogo, validate(createBrandSchema), createBrand);

router.route('/:id')
    .get(getBrand)
    .patch(protect, authorize('admin'), uploadBrandLogo, validate(updateBrandSchema), updateBrand);

router.route('/:id')
    .delete(protect, authorize('admin'), deleteBrand);

export default router;