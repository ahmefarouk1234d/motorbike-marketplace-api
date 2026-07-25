import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import sanitize from "./middleware/sanitize.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import authRouter from './routes/auth.routes.js';
import listingRouter from './routes/listing.routes.js';
import brandRouter from './routes/brand.routes.js';
import favoriteRouter from './routes/favorite.routes.js';
import statsRouter from './routes/stats.routes.js';
const app = express();

app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));
app.use(express.json());

// Limits are skipped under test so the suite is not throttled by its own traffic.
const skipInTest = () => process.env.NODE_ENV === 'test';

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: skipInTest,
    message: { success: false, message: 'Too many requests, please try again later' }
});

// Credential endpoints get a much tighter budget. skipSuccessfulRequests means a
// legitimate user logging in repeatedly is never penalised - only failures count,
// which is what makes this a brute-force control rather than a usage cap.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: skipInTest,
    message: { success: false, message: 'Too many attempts, please try again later' }
});

app.use('/api', apiLimiter);
app.use(sanitize);

app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Server is running!' });
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRouter);
app.use('/api/listings', listingRouter);
app.use('/api/brands', brandRouter);
app.use('/api/favorites', favoriteRouter);
app.use('/api/stats', statsRouter);
app.use(notFound);
app.use(errorHandler);

export default app;