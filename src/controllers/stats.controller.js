import Listing from '../models/listing.model.js';
import asyncHandler from '../utils/asyncHandler.js';

const getStats = asyncHandler(async (req, res, next) => {
    // total listings, average price, min/max — overall
    const overview = await Listing.aggregate([
        {
            $group: {
                _id: null,
                totalListings: { $sum: 1 },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        }
    ]);

    // count + average price grouped by city
    const byCity = await Listing.aggregate([
        {
            $group: {
                _id: '$city',
                count: { $sum: 1 },
                avgPrice: { $avg: '$price' }
            }
        },
        { $sort: { count: -1 } }
    ]);

    // count grouped by brand (with brand name via lookup)
    const byBrand = await Listing.aggregate([
        {
            $group: {
                _id: '$brand',
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'brands',
                localField: '_id',
                foreignField: '_id',
                as: 'brand'
            }
        },
        { $unwind: '$brand' },
        {
            $project: {
                _id: 0,
                brand: '$brand.name',
                count: 1
            }
        },
        { $sort: { count: -1 } }
    ]);

    res.status(200).json({
        success: true,
        data: {
            overview: overview[0] || {},
            byCity,
            byBrand
        }
    });
});

export { getStats };