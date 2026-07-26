import { randomUUID } from 'crypto';
import getBucket from '../config/firebase.js';
import AppError from '../utils/AppError.js';

const EXTENSIONS = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
};

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
        resumable: false,
        contentType: file.mimetype,
        metadata: {
            metadata: { firebaseStorageDownloadTokens: token }
        }
    });

    return { url: buildDownloadUrl(bucket.name, path, token), path };
};

const uploadFiles = (files, folder) =>
    Promise.all(files.map((file) => uploadFile(file, folder)));

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
