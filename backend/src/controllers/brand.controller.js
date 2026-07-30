import Brand from '../models/brand.model.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadFile, deleteFile } from '../utils/storage.js';
 const getAllBrands = asyncHandler(async (req, res, next) => {
 const brands = await Brand.find()
 res.status(200).json({ success: true,results: brands.length, data: brands });


 })
  const getBrand = asyncHandler(async (req, res, next) => {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
        return next(new AppError('Brand not found', 404));
    }
res.status(200).json({ success: true, data: brand });
})

const createBrand = asyncHandler(async (req, res, next) => {

    if (!req.file) {
        return next(new AppError('A logo image is required', 400));
    }
    if (await Brand.findOne({ name: req.body.name })) {
        return next(new AppError('Brand name already exists', 409));
    }

    const logo = await uploadFile(req.file, 'brands');
    try {
        const brand = await Brand.create({ ...req.body, logo });
        res.status(201).json({ success: true, data: brand });
    } catch (err) {
        await deleteFile(logo.path);
        throw err;
    }
})

const updateBrand = asyncHandler(async (req, res, next) => {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
        return next(new AppError('Brand not found', 404));
    }

    const logo = req.file ? await uploadFile(req.file, 'brands') : null;
    const superseded = logo ? brand.logo?.path : null;

    Object.assign(brand, req.body);
    if (logo) brand.logo = logo;

    try {
        await brand.save();
    } catch (err) {
        if (logo) await deleteFile(logo.path);
        throw err;
    }

    await deleteFile(superseded);
    res.status(200).json({ success: true, data: brand });
})
const deleteBrand = asyncHandler(async (req, res, next) => {

    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) {
        return next(new AppError('Brand not found', 404));
    }
    await deleteFile(brand.logo?.path);
    res.status(200).json({ success: true, data: brand });
})

export { getAllBrands, getBrand, createBrand, updateBrand, deleteBrand };