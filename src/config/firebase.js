// firebase-admin v13+ ships modular subpath exports. Under "type": "module" the
// legacy `admin.credential.cert()` / `admin.storage()` namespace does not exist -
// the default export is the app module, so those calls fail at runtime.
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

// Initialisation is lazy so the server still boots without Firebase credentials.
// Only the upload endpoints fail, and they fail with a clear 500 instead of
// crashing the whole process at startup.
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
                // A .env file cannot hold real line breaks, so the key is stored
                // with literal \n sequences that have to be turned back into
                // newlines or the PEM parser rejects it.
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            }),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });
    }

    bucket = getStorage().bucket();
    return bucket;
};

export default getBucket;
