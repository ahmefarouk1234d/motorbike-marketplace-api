import { jest, describe, test, expect } from '@jest/globals';
import request from 'supertest';
import './setup.js';
import { makeUser, storageMock } from './helpers.js';

jest.unstable_mockModule('../src/utils/storage.js', () => storageMock());

const { default: app } = await import('../src/app.js');
const { default: Listing } = await import('../src/models/listing.model.js');
const { default: Brand } = await import('../src/models/brand.model.js');

describe('API documentation', () => {
    test('serves the Swagger UI page', async () => {
        const res = await request(app).get('/api/docs/');

        expect(res.status).toBe(200);
        expect(res.text).toContain('swagger-ui');
    });

    test('serves the raw OpenAPI document', async () => {
        const res = await request(app).get('/api/docs.json');

        expect(res.status).toBe(200);
        expect(res.body.openapi).toBe('3.0.3');
        expect(res.body.info.title).toBe('Motorbike Marketplace API');
    });

    test('documents every mounted route prefix', async () => {
        const { body } = await request(app).get('/api/docs.json');
        const paths = Object.keys(body.paths);

        for (const expected of [
            '/api/auth/register',
            '/api/auth/login',
            '/api/auth/verify-email/{token}',
            '/api/auth/forgot-password',
            '/api/auth/reset-password/{token}',
            '/api/listings',
            '/api/listings/{id}',
            '/api/brands',
            '/api/favorites',
            '/api/stats'
        ]) {
            expect(paths).toContain(expected);
        }
    });

    test('no $ref in the document points at a missing schema', async () => {
        const { body } = await request(app).get('/api/docs.json');
        const defined = Object.keys(body.components.schemas);

        const refs = [...JSON.stringify(body).matchAll(/"#\/components\/schemas\/(\w+)"/g)]
            .map((m) => m[1]);

        expect(refs.length).toBeGreaterThan(0);
        for (const ref of new Set(refs)) expect(defined).toContain(ref);
    });
});

describe('view counter', () => {
    const seedApproved = async () => {
        const { user, token } = await makeUser({ role: 'seller' });
        const brand = await Brand.create({ name: `B${Date.now()}` });
        const listing = await Listing.create({
            title: 'Viewed bike', description: 'A description long enough to pass.',
            price: 1000, brand: brand._id, model: 'M', year: 2024, mileage: 0,
            engineCC: 200, condition: 'new', city: 'Cairo',
            seller: user._id, status: 'approved'
        });
        return { listing, ownerToken: token };
    };

    test('increments on each anonymous view', async () => {
        const { listing } = await seedApproved();

        const first = await request(app).get(`/api/listings/${listing._id}`);
        expect(first.body.data.viewsCount).toBe(1);

        await request(app).get(`/api/listings/${listing._id}`);

        const stored = await Listing.findById(listing._id);
        expect(stored.viewsCount).toBe(2);
    });

    test('does not count the seller viewing their own listing', async () => {
        const { listing, ownerToken } = await seedApproved();

        await request(app)
            .get(`/api/listings/${listing._id}`)
            .set('Authorization', `Bearer ${ownerToken}`);

        const stored = await Listing.findById(listing._id);
        expect(stored.viewsCount).toBe(0);
    });
});
