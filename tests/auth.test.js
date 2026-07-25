import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import './setup.js';
import { PNG, makeUser, storageMock } from './helpers.js';

const storage = storageMock();
jest.unstable_mockModule('../src/utils/storage.js', () => storage);

const { default: app } = await import('../src/app.js');

describe('registration and login', () => {
    test('registers a user and returns a token', async () => {
        const res = await request(app).post('/api/auth/register').send({
            fullName: 'New User',
            email: 'new@test.com',
            password: 'password123'
        });

        expect(res.status).toBe(201);
        expect(typeof res.body.token).toBe('string');
        expect(res.body.data.email).toBe('new@test.com');
    });

    test('never returns the password hash', async () => {
        const res = await request(app).post('/api/auth/register').send({
            fullName: 'New User',
            email: 'nohash@test.com',
            password: 'password123'
        });

        expect(JSON.stringify(res.body)).not.toContain('password');
    });

    test('rejects a duplicate email', async () => {
        await makeUser({ email: 'dupe@test.com' });

        const res = await request(app).post('/api/auth/register').send({
            fullName: 'Copy', email: 'dupe@test.com', password: 'password123'
        });

        expect(res.status).toBe(409);
    });

    test('logs in with correct credentials', async () => {
        await makeUser({ email: 'login@test.com' });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'login@test.com', password: 'password123' });

        expect(res.status).toBe(200);
        expect(typeof res.body.token).toBe('string');
    });

    test('rejects a wrong password', async () => {
        await makeUser({ email: 'wrong@test.com' });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'wrong@test.com', password: 'not-the-password' });

        expect(res.status).toBe(401);
    });
});

describe('PATCH /api/auth/me/avatar', () => {
    beforeEach(() => jest.clearAllMocks());

    test('stores an uploaded avatar as { url, path }', async () => {
        const { token } = await makeUser();

        const res = await request(app)
            .patch('/api/auth/me/avatar')
            .set('Authorization', `Bearer ${token}`)
            .attach('avatar', PNG, 'me.png');

        expect(res.status).toBe(200);
        expect(res.body.data.avatar).toEqual({
            url: expect.stringContaining('https://'),
            path: expect.stringContaining('avatars/')
        });
        expect(storage.uploadFile).toHaveBeenCalledTimes(1);
    });

    test('deletes the previous avatar when one is replaced', async () => {
        const { user, token } = await makeUser();
        user.avatar = { url: 'https://fake/old.png', path: 'avatars/old.png' };
        await user.save({ validateBeforeSave: false });

        const res = await request(app)
            .patch('/api/auth/me/avatar')
            .set('Authorization', `Bearer ${token}`)
            .attach('avatar', PNG, 'new.png');

        expect(res.status).toBe(200);
        expect(storage.deleteFile).toHaveBeenCalledWith('avatars/old.png');
    });

    test('rejects a request with no file', async () => {
        const { token } = await makeUser();

        const res = await request(app)
            .patch('/api/auth/me/avatar')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/required/i);
    });

    test('requires authentication', async () => {
        const res = await request(app)
            .patch('/api/auth/me/avatar')
            .attach('avatar', PNG, 'me.png');

        expect(res.status).toBe(401);
    });
});
