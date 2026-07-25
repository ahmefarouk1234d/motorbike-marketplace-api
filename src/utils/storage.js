import { randomUUID } from 'crypto';
import getBucket from '../config/firebase.js';
import AppError from '../utils/AppError.js';

const EXTENSIONS = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
};

// Mirrors the url the Firebase client SDK's getDownloadURL() hands back. It never
// expires, so it can be stored in Mongo and served straight to the frontend.
const buildDownloadUrl = (bucketName, path, token) =>
    `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;

const uploadFile = async (file, folder) => {
    const extension = EXTENSIONS[file.mimetype];
    if (!extension) {
        throw new AppError(`Unsupported file type: ${file.mimetype}`, 400);
    }

    const bucket = getBucket();
    const path = `${folder}/${randomUUID()}.${extension}`;
    const token = randomUUID();

    await bucket.file(path).save(file.buffer, {
        // Small images do not benefit from a resumable session, and skipping it
        // saves a round trip per upload.
        resumable: false,
        contentType: file.mimetype,
        // The outer `metadata` is the object's metadata resource; the inner one
        // is its custom key/value bag. The download token has to live in the
        // inner bag or Firebase will not honour it.
        metadata: {
            metadata: { firebaseStorageDownloadTokens: token }
        }
    });

    return { url: buildDownloadUrl(bucket.name, path, token), path };
};

const uploadFiles = (files, folder) =>
    Promise.all(files.map((file) => uploadFile(file, folder)));

// Cleanup must never turn a successful request into a failed one. The database
// is the source of truth, so a storage error is logged and swallowed.
const deleteFile = async (path) => {
    if (!path) return;
    try {
        await getBucket().file(path).delete();
    } catch (err) {
        console.error(`Failed to delete ${path} from storage:`, err.message);
    }
};

const deleteFiles = (paths = []) => Promise.all(paths.map(deleteFile));

export { uploadFile, uploadFiles, deleteFile, deleteFiles };
