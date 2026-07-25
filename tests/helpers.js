import { jest } from '@jest/globals';
import User from '../src/models/user.model.js';
import Brand from '../src/models/brand.model.js';

// A real 1x1 PNG, so multer's mimetype filter sees a genuine image.
export const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
);

let counter = 0;
const uniqueEmail = () => `user${++counter}.${process.pid}@test.com`;

export const makeUser = async (overrides = {}) => {
    const user = await User.create({
        fullName: 'Test User',
        email: uniqueEmail(),
        password: 'password123',
        ...overrides
    });
    return { user, token: user.generateJWT() };
};

export const makeBrand = (overrides = {}) =>
    Brand.create({ name: `Brand${++counter}`, description: 'test brand', ...overrides });

// Stand-in for src/utils/storage.js. Returns the same { url, path } shape as the
// real module so controllers cannot tell the difference, without touching Firebase.
export const storageMock = () => ({
    uploadFile: jest.fn(async (file, folder) => ({
        url: `https://fake.storage/${folder}/file.png`,
        path: `${folder}/file.png`
    })),
    uploadFiles: jest.fn(async (files, folder) =>
        files.map((file, i) => ({
            url: `https://fake.storage/${folder}/file${i}.png`,
            path: `${folder}/file${i}.png`
        }))
    ),
    deleteFile: jest.fn(async () => {}),
    deleteFiles: jest.fn(async () => {})
});

export const listingFields = (brandId) => ({
    title: 'SYM NHX 200 ABS 2024',
    description: 'Brand new SYM NHX 200 with ABS and agent warranty.',
    price: '145000',
    brand: String(brandId),
    model: 'NHX 200 ABS',
    year: '2024',
    mileage: '0',
    engineCC: '200',
    condition: 'new',
    city: 'Cairo'
});
