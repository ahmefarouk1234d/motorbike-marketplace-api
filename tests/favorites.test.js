import { jest, describe, test, expect } from '@jest/globals';
import request from 'supertest';
import './setup.js';
import { makeUser, makeBrand, storageMock } from './helpers.js';

jest.unstable_mockModule('../src/utils/storage.js', () => storageMock());

const { default: app } = await import('../src/app.js');
const { default: Listing } = await import('../src/models/listing.model.js');

const seedListing = async () => {
    const { user } = await makeUser({ role: 'seller' });
    const brand = await makeBrand();
    return Listing.create({
        title: 'Favourite bike', description: 'A description long enough to pass.',
        price: 1000, brand: brand._id, model: 'M', year: 2024, mileage: 0,
        engineCC: 200, condition: 'new', city: 'Cairo',
        seller: user._id, status: 'approved'
    });
};

describe('favorites', () => {
    test('saves a listing and lists it back', async () => {
        const listing = await seedListing();
        const { token } = await makeUser();

        const saved = await request(app)
            .post(`/api/favorites/${listing._id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(saved.status).toBe(201);

        const list = await request(app)
            .get('/api/favorites')
            .set('Authorization', `Bearer ${token}`);
        expect(list.status).toBe(200);
        expect(list.body.data).toHaveLength(1);
        expect(list.body.data[0].listing.title).toBe('Favourite bike');
    });

    test('saving the same listing twice reports a clear conflict', async () => {
        const listing = await seedListing();
        const { token } = await makeUser();

        await request(app).post(`/api/favorites/${listing._id}`).set('Authorization', `Bearer ${token}`);
        const again = await request(app)
            .post(`/api/favorites/${listing._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(again.status).toBe(409);
        expect(again.body.message).toMatch(/already in your favorites/i);
    });

    test('two users can save the same listing', async () => {
        const listing = await seedListing();
        const a = await makeUser();
        const b = await makeUser();

        const first = await request(app).post(`/api/favorites/${listing._id}`).set('Authorization', `Bearer ${a.token}`);
        const second = await request(app).post(`/api/favorites/${listing._id}`).set('Authorization', `Bearer ${b.token}`);

        expect(first.status).toBe(201);
        expect(second.status).toBe(201);
    });

    test('removes a saved listing', async () => {
        const listing = await seedListing();
        const { token } = await makeUser();

        await request(app).post(`/api/favorites/${listing._id}`).set('Authorization', `Bearer ${token}`);
        const removed = await request(app)
            .delete(`/api/favorites/${listing._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(removed.status).toBe(200);

        const list = await request(app).get('/api/favorites').set('Authorization', `Bearer ${token}`);
        expect(list.body.data).toHaveLength(0);
    });

    test('removing something not saved is a 404', async () => {
        const listing = await seedListing();
        const { token } = await makeUser();

        const res = await request(app)
            .delete(`/api/favorites/${listing._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    test('requires authentication', async () => {
        const listing = await seedListing();
        const res = await request(app).post(`/api/favorites/${listing._id}`);
        expect(res.status).toBe(401);
    });
});
