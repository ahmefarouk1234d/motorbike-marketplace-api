import express from 'express';
import { getStats } from '../controllers/stats.controller.js';
import protect from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';

const router = express.Router();
router.get('/', protect, authorize('admin'), getStats);
export default router;