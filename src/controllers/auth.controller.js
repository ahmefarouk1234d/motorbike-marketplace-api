import User from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadFile, deleteFile } from '../utils/storage.js';

const registerUser = asyncHandler(async (req, res, next) => {
    const { fullName, email, password, phone, city } = req.body;

const existinguser = await User.findOne({ email });
    if (existinguser) {
        return next(new AppError('Email already in use', 409));
    }

    const user = await User.create({ fullName, email, password , phone, city });
    const token = user.generateJWT();
   res.status(201).json({
    success: true,
    token,
    data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
    }
});
});
 
const loginUser = asyncHandler(async (req, res, next) => {
const { email, password } = req.body;
const user = await User.findOne({ email }).select('+password');
if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401));
}
const token = user.generateJWT();
res.status(200).json({
    success: true,
    token,
    data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
    }
});
});
const updateAvatar = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('An avatar image is required', 400));
    }

    const superseded = req.user.avatar?.path;
    const avatar = await uploadFile(req.file, `avatars/${req.user._id}`);

    // findByIdAndUpdate rather than user.save(): `protect` loads the user without
    // the select:false password field, and a targeted update sidesteps re-running
    // the password hashing hook entirely.
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { avatar },
        { returnDocument: 'after', runValidators: true }
    );

    await deleteFile(superseded);

    res.status(200).json({
        success: true,
        data: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            avatar: user.avatar
        }
    });
});

export { registerUser, loginUser, updateAvatar };
