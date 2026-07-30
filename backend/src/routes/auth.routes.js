import express from 'express';
import {
    registerUser,
    loginUser,
    updateAvatar,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword
} from '../controllers/auth.controller.js';
import validate from '../middleware/validate.js';
import { uploadAvatar } from '../middleware/upload.js';
import {
    registerSchema,
    loginSchema,
    emailOnlySchema,
    resetPasswordSchema
} from '../validators/auth.validator.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);

router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', validate(emailOnlySchema), resendVerification);
router.post('/forgot-password', validate(emailOnlySchema), forgotPassword);
router.patch('/reset-password/:token', validate(resetPasswordSchema), resetPassword);
router.get('/me', protect, (req, res) => {
    res.json({
        success: true,
        data: {
            id: req.user._id,
            fullName: req.user.fullName,
            email: req.user.email,
            role: req.user.role,
            isVerified: req.user.isVerified,
            avatar: req.user.avatar
        }
    });
});
router.patch('/me/avatar', protect, uploadAvatar, updateAvatar);

export default router;