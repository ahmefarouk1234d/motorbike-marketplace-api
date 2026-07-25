import multer from 'multer';
import AppError from '../utils/AppError.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_LISTING_IMAGES = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Files are held in memory rather than written to disk because they are streamed
// straight on to Firebase - there is no point touching the filesystem in between.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
        cb(new AppError('Only JPEG, PNG and WebP images are allowed', 400));
    }
});

const uploadListingImages = upload.array('images', MAX_LISTING_IMAGES);
const uploadAvatar = upload.single('avatar');
const uploadBrandLogo = upload.single('logo');

export { uploadListingImages, uploadAvatar, uploadBrandLogo, MAX_FILE_SIZE, MAX_LISTING_IMAGES };
