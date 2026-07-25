import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import './setup.js';
import { PNG, makeUser, makeBrand, storageMock, listingFields } from './helpers.js';

// Registered before app.js is pulled in, so the controllers resolve to this
// instead of the real Firebase module. No test touches the network.
const storage = storageMock();
jest.unstable_mockModule('../src/utils/storage.js', () => storage);

const { default: app } = await import('../src/app.js');
const { default: Listing } = await import('../src/models/listing.model.js');

const post = (token, fields, files = []) => {
    const req = request(app).post('/api/listings').set('Authorization', `Bearer ${token}`);
    for (const [key, value] of Object.entries(fields)) req.field(key, value);
    for (const [name, buffer, filename] of files) req.attach(name, buffer, filename);
    return req;
};

describe('POST /api/listings (multipart)', () => {
    beforeEach(() => jest.clearAllMocks());

    test('creates a listing from multipart form data with uploaded images', async () => {
        const { user, token } = await makeUser({ role: 'seller' });
        const brand = await makeBrand();

        const res = await post(token, listingFields(brand._id), [
            ['images', PNG, 'one.png'],
            ['images', PNG, 'two.png']
        ]);

        expect(res.status).toBe(201);
        expect(res.body.data.images).toHaveLength(2);
        expect(res.body.data.images[0]).toEqual({
            url: expect.stringContaining('https://'),
            path: expect.stringContaining('listings/')
        });
        expect(res.body.data.seller).toBe(String(user._id));
        expect(storage.uploadFiles).toHaveBeenCalledTimes(1);
    });

    test('coerces numeric fields that multipart delivers as strings', async () => {
        const { token } = await makeUser({ role: 'seller' });
        const brand = await makeBrand();

        const res = await post(token, listingFields(brand._id), [['images', PNG, 'a.png']]);

        expect(res.status).toBe(201);
        // The regression this guards: z.number() would reject "145000" outright.
        expect(res.body.data.price).toBe(145000);
        expect(res.body.data.year).toBe(2024);
        expect(res.body.data.engineCC).toBe(200);
    });

    test('ignores a client-supplied images field', async () => {
        const { token } = await makeUser({ role: 'seller' });
        const brand = await makeBrand();

        const res = await post(
            token,
            { ...listingFields(brand._id), images: JSON.stringify([{ url: 'https://evil/x.jpg', path: 'x' }]) },
            [['images', PNG, 'real.png']]
        );

        expect(res.status).toBe(201);
        expect(res.body.data.images).toHaveLength(1);
        expect(JSON.stringify(res.body.data.images)).not.toContain('evil');
    });

    test('creates a listing with no images at all', async () => {
        const { token } = await makeUser({ role: 'seller' });
        const brand = await makeBrand();

        const res = await post(token, listingFields(brand._id));

        expect(res.status).toBe(201);
        expect(res.body.data.images).toEqual([]);
        expect(storage.uploadFiles).not.toHaveBeenCalled();
    });

    test('rejects a non-image upload', async () => {
        const { token } = await makeUser({ role: 'seller' });
        const brand = await makeBrand();

        const res = await post(token, listingFields(brand._id), [
            ['images', Buffer.from('%PDF-1.4'), 'invoice.pdf']
        ]);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/JPEG, PNG and WebP/);
        expect(storage.uploadFiles).not.toHaveBeenCalled();
    });

    test('rejects a file over the 5MB limit', async () => {
        const { token } = await makeUser({ role: 'seller' });
        const brand = await makeBrand();

        const res = await post(token, listingFields(brand._id), [
            ['images', Buffer.alloc(6 * 1024 * 1024), 'huge.png']
        ]);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/File too large/);
    });

    test('rejects an invalid field even when a file is attached', async () => {
        const { token } = await makeUser({ role: 'seller' });
        const brand = await makeBrand();

        const res = await post(
            token,
            { ...listingFields(brand._id), price: 'not-a-number' },
            [['images', PNG, 'a.png']]
        );

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/price/);
    });

    test('rejects a buyer', async () => {
        const { token } = await makeUser({ role: 'buyer' });
        const brand = await makeBrand();

        const res = await post(token, listingFields(brand._id));

        expect(res.status).toBe(403);
    });
});

describe('GET /api/listings visibility', () => {
    const seedMixed = async (sellerId, brandId) => {
        const base = {
            description: 'A description long enough to pass validation.',
            brand: brandId, model: 'M', year: 2024, mileage: 0,
            engineCC: 200, condition: 'new', city: 'Cairo', seller: sellerId
        };
        await Listing.create([
            { ...base, title: 'Approved bike', price: 100000, status: 'approved' },
            { ...base, title: 'Pending bike', price: 200000, status: 'pending' },
            { ...base, title: 'Rejected bike', price: 300000, status: 'rejected' }
        ]);
    };

    test('anonymous callers see only approved listings', async () => {
        const { user } = await makeUser({ role: 'seller' });
        const brand = await makeBrand();
        await seedMixed(user._id, brand._id);

        const res = await request(app).get('/api/listings');

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].title).toBe('Approved bike');
    });

    test('?status=pending does not expose unapproved listings', async () => {
        const { user } = await makeUser({ role: 'seller' });
        const brand = await makeBrand();
        await seedMixed(user._id, brand._id);

        const res = await request(app).get('/api/listings?status=pending');

        expect(res.status).toBe(200);
        expect(res.body.data.every((l) => l.status === 'approved')).toBe(true);
    });

    test('an admin can list pending listings', async () => {
        const { user } = await makeUser({ role: 'seller' });
        const { token } = await makeUser({ role: 'admin' });
        const brand = await makeBrand();
        await seedMixed(user._id, brand._id);

        const res = await request(app)
            .get('/api/listings?status=pending')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].title).toBe('Pending bike');
    });

    test('range filtering by price works', async () => {
        const { user } = await makeUser({ role: 'seller' });
        const brand = await makeBrand();
        const base = {
            description: 'A description long enough to pass validation.',
            brand: brand._id, model: 'M', year: 2024, mileage: 0,
            engineCC: 200, condition: 'new', city: 'Cairo',
            seller: user._id, status: 'approved'
        };
        await Listing.create([
            { ...base, title: 'Cheap', price: 40000 },
            { ...base, title: 'Expensive', price: 150000 }
        ]);

        const res = await request(app).get('/api/listings?price[gte]=100000');

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].title).toBe('Expensive');
    });

    test('an unknown filter field is ignored rather than applied', async () => {
        const { user } = await makeUser({ role: 'seller' });
        const brand = await makeBrand();
        await seedMixed(user._id, brand._id);

        const res = await request(app).get('/api/listings?viewsCount=999999');

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
    });
});

describe('GET /api/listings/:id visibility', () => {
    const makePending = async () => {
        const { user, token } = await makeUser({ role: 'seller' });
        const brand = await makeBrand();
        const listing = await Listing.create({
            title: 'Pending bike', description: 'A description long enough to pass.',
            price: 1000, brand: brand._id, model: 'M', year: 2024, mileage: 0,
            engineCC: 200, condition: 'new', city: 'Cairo',
            seller: user._id, status: 'pending'
        });
        return { listing, ownerToken: token };
    };

    test('is hidden from anonymous callers', async () => {
        const { listing } = await makePending();
        const res = await request(app).get(`/api/listings/${listing._id}`);
        expect(res.status).toBe(404);
    });

    test('is hidden from an unrelated user', async () => {
        const { listing } = await makePending();
        const { token } = await makeUser({ role: 'seller' });

        const res = await request(app)
            .get(`/api/listings/${listing._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    test('is visible to its owner', async () => {
        const { listing, ownerToken } = await makePending();

        const res = await request(app)
            .get(`/api/listings/${listing._id}`)
            .set('Authorization', `Bearer ${ownerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.title).toBe('Pending bike');
    });

    test('is visible to an admin', async () => {
        const { listing } = await makePending();
        const { token } = await makeUser({ role: 'admin' });

        const res = await request(app)
            .get(`/api/listings/${listing._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
    });
});

describe('DELETE /api/listings/:id', () => {
    beforeEach(() => jest.clearAllMocks());

    test('removes the stored files along with the document', async () => {
        const { user, token } = await makeUser({ role: 'seller' });
        const brand = await makeBrand();
        const listing = await Listing.create({
            title: 'With images', description: 'A description long enough to pass.',
            price: 1000, brand: brand._id, model: 'M', year: 2024, mileage: 0,
            engineCC: 200, condition: 'new', city: 'Cairo', seller: user._id,
            images: [
                { url: 'https://fake/a.png', path: 'listings/a.png' },
                { url: 'https://fake/b.png', path: 'listings/b.png' }
            ]
        });

        const res = await request(app)
            .delete(`/api/listings/${listing._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(storage.deleteFiles).toHaveBeenCalledWith(['listings/a.png', 'listings/b.png']);
        expect(await Listing.findById(listing._id)).toBeNull();
    });
});
