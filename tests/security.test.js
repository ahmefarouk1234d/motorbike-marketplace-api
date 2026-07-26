import { jest, describe, test, expect } from '@jest/globals';
import request from 'supertest';
import './setup.js';
import { makeUser, storageMock } from './helpers.js';

jest.unstable_mockModule('../src/utils/storage.js', () => storageMock());

const { default: app } = await import('../src/app.js');

describe('NoSQL injection', () => {
    test('an operator object in the login body cannot bypass authentication', async () => {
        await makeUser({ email: 'victim@test.com' });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: { $gt: '' }, password: { $gt: '' } });

        expect(res.status).not.toBe(200);
        expect(res.body.token).toBeUndefined();
    });

    test('an operator nested in a registration field is stripped', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                fullName: 'Attacker',
                email: 'attacker@test.com',
                password: 'password123',
                role: { $ne: 'buyer' }
            });

        expect(res.status).toBe(201);
        expect(res.body.data.role).toBe('buyer');
    });

    test('operator syntax in the query string does not reach the database', async () => {
        const res = await request(app).get('/api/listings?price[$gt]=0&city[$ne]=x');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});

describe('privilege escalation', () => {
    test('a buyer cannot change a listing status', async () => {
        const { token } = await makeUser({ role: 'buyer' });

        const res = await request(app)
            .patch('/api/listings/507f1f77bcf86cd799439011/status')
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'approved' });

        expect(res.status).toBe(403);
    });

    test('a buyer cannot reach the admin stats endpoint', async () => {
        const { token } = await makeUser({ role: 'buyer' });

        const res = await request(app)
            .get('/api/stats')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(403);
    });

    test('an invalid token is rejected on a protected route', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer not-a-real-token');

        expect(res.status).toBe(401);
    });

    test('an invalid token is ignored, not fatal, on a public route', async () => {
        const res = await request(app)
            .get('/api/listings')
            .set('Authorization', 'Bearer not-a-real-token');

        expect(res.status).toBe(200);
    });
});
