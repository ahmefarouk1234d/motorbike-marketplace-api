import express from "express";
import helmet from "helmet";
import cors from "cors";
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

app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Server is running!' });
});

app.use('/api/auth', authRouter);
app.use('/api/listings', listingRouter);
app.use('/api/brands', brandRouter);
app.use('/api/favorites', favoriteRouter);
app.use('/api/stats', statsRouter);
app.use(notFound);
app.use(errorHandler);

export default app;