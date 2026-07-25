import express from 'express';
import { registerUser, loginUser, updateAvatar } from '../controllers/auth.controller.js';
import validate from '../middleware/validate.js';
import { uploadAvatar } from '../middleware/upload.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.get('/me', protect, (req, res) => {
    res.json({ success: true, data: { id: req.user._id, email: req.user.email, role: req.user.role, avatar: req.user.avatar } });
});
router.patch('/me/avatar', protect, uploadAvatar, updateAvatar);

export default router;