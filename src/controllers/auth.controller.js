import User from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadFile, deleteFile } from '../utils/storage.js';
import sendEmail from '../utils/sendEmail.js';
import { verificationEmail, passwordResetEmail } from '../utils/emailTemplates.js';

const clientUrl = () => process.env.CLIENT_URL || 'http://localhost:3000';

// A mail outage must not take registration or password reset down with it, so
// delivery failures are logged and swallowed rather than surfaced to the caller.
const deliver = async (to, message) => {
    try {
        await sendEmail({ to, ...message });
        return true;
    } catch (err) {
        console.error(`Failed to send "${message.subject}" to ${to}:`, err.message);
        return false;
    }
};

const registerUser = asyncHandler(async (req, res, next) => {
    const { fullName, email, password, phone, city } = req.body;

const existinguser = await User.findOne({ email });
    if (existinguser) {
        return next(new AppError('Email already in use', 409));
    }

    const user = await User.create({ fullName, email, password , phone, city });

    const rawToken = user.createVerificationToken();
    await user.save({ validateBeforeSave: false });
    await deliver(user.email, verificationEmail(`${clientUrl()}/verify-email/${rawToken}`));

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

const verifyEmail = asyncHandler(async (req, res, next) => {
    // select:false hides these from the result, not from the query condition, so
    // they must be selected back in to be cleared afterwards.
    const user = await User.findOne({
        verificationToken: User.hashToken(req.params.token),
        verificationExpires: { $gt: new Date() }
    }).select('+verificationToken +verificationExpires');

    if (!user) {
        return next(new AppError('Verification link is invalid or has expired', 400));
    }

    user.isVerified = true;
    // Clearing both fields makes the link single-use.
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Email verified' });
});

const resendVerification = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email })
        .select('+verificationToken +verificationExpires');

    if (user && !user.isVerified) {
        const rawToken = user.createVerificationToken();
        await user.save({ validateBeforeSave: false });
        await deliver(user.email, verificationEmail(`${clientUrl()}/verify-email/${rawToken}`));
    }

    // Always the same reply. Confirming whether an address exists, or whether it
    // is already verified, would turn this into an account enumeration oracle.
    res.status(200).json({
        success: true,
        message: 'If that address needs verifying, a new link has been sent'
    });
});

const forgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email })
        .select('+passwordResetToken +passwordResetExpires');

    if (user) {
        const rawToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });
        await deliver(user.email, passwordResetEmail(`${clientUrl()}/reset-password/${rawToken}`));
    }

    res.status(200).json({
        success: true,
        message: 'If that address has an account, a reset link has been sent'
    });
});

const resetPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({
        passwordResetToken: User.hashToken(req.params.token),
        passwordResetExpires: { $gt: new Date() }
    }).select('+password +passwordResetToken +passwordResetExpires');

    if (!user) {
        return next(new AppError('Reset link is invalid or has expired', 400));
    }

    // Assigning password marks it modified, so the pre-save hook rehashes it.
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // A fresh token is returned so the user is signed in straight after resetting.
    res.status(200).json({ success: true, token: user.generateJWT() });
});

export {
    registerUser,
    loginUser,
    updateAvatar,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword
};
