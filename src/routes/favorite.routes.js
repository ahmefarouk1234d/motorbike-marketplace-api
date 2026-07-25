import express from 'express';
import { addFavorite, getUserFavorites, removeFavorite } from '../controllers/favorite.controller.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getUserFavorites);
router.post('/:listingId', protect, addFavorite);
router.delete('/:listingId', protect, removeFavorite);

export default router;