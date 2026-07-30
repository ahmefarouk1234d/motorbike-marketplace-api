import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import AppError from '../utils/AppError.js';

const REQUIRED_VARS = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_STORAGE_BUCKET'
];

let bucket = null;

const getBucket = () => {
    if (bucket) return bucket;

    const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
    if (missing.length) {
        throw new AppError(`File uploads are not configured. Missing: ${missing.join(', ')}`, 500);
    }

    if (!getApps().length) {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            }),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });
    }

    bucket = getStorage().bucket();
    return bucket;
};

export default getBucket;
