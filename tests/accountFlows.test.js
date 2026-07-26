import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import './setup.js';
import { makeUser, storageMock } from './helpers.js';

jest.unstable_mockModule('../src/utils/storage.js', () => storageMock());

const sendEmail = jest.fn(async () => {});
jest.unstable_mockModule('../src/utils/sendEmail.js', () => ({ default: sendEmail }));

const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/user.model.js');

const lastLink = () => {
    const { text } = sendEmail.mock.calls.at(-1)[0];
    return text.match(/https?:\/\/\S+/)[0];
};
const tokenFrom = (link) => link.split('/').pop();

describe('email verification', () => {
    beforeEach(() => jest.clearAllMocks());

    test('registration sends a verification email', async () => {
        const res = await request(app).post('/api/auth/register').send({
            fullName: 'New User', email: 'verify@test.com', password: 'password123'
        });

        expect(res.status).toBe(201);
        expect(sendEmail).toHaveBeenCalledTimes(1);
        expect(sendEmail.mock.calls[0][0].to).toBe('verify@test.com');
        expect(sendEmail.mock.calls[0][0].subject).toMatch(/confirm/i);
    });

    test('the emailed token verifies the account', async () => {
        await request(app).post('/api/auth/register').send({
            fullName: 'New User', email: 'verify2@test.com', password: 'password123'
        });

        const res = await request(app).get(`/api/auth/verify-email/${tokenFrom(lastLink())}`);

        expect(res.status).toBe(200);
        const user = await User.findOne({ email: 'verify2@test.com' });
        expect(user.isVerified).toBe(true);
    });

    test('the raw token is never stored, only its hash', async () => {
        await request(app).post('/api/auth/register').send({
            fullName: 'New User', email: 'hash@test.com', password: 'password123'
        });
        const raw = tokenFrom(lastLink());

        const user = await User.findOne({ email: 'hash@test.com' })
            .select('+verificationToken');

        expect(user.verificationToken).toBeDefined();
        expect(user.verificationToken).not.toBe(raw);
        expect(user.verificationToken).toBe(User.hashToken(raw));
    });

    test('a verification link cannot be reused', async () => {
        await request(app).post('/api/auth/register').send({
            fullName: 'New User', email: 'once@test.com', password: 'password123'
        });
        const token = tokenFrom(lastLink());

        expect((await request(app).get(`/api/auth/verify-email/${token}`)).status).toBe(200);
        expect((await request(app).get(`/api/auth/verify-email/${token}`)).status).toBe(400);
    });

    test('an expired verification link is rejected', async () => {
        const { user } = await makeUser({ email: 'expired@test.com' });
        const raw = user.createVerificationToken();
        user.verificationExpires = new Date(Date.now() - 1000);
        await user.save({ validateBeforeSave: false });

        const res = await request(app).get(`/api/auth/verify-email/${raw}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/invalid or has expired/i);
    });

    test('a bogus token is rejected', async () => {
        const res = await request(app).get('/api/auth/verify-email/not-a-real-token');
        expect(res.status).toBe(400);
    });

    test('resend does not reveal whether an address exists', async () => {
        await makeUser({ email: 'known@test.com' });

        const known = await request(app).post('/api/auth/resend-verification').send({ email: 'known@test.com' });
        const unknown = await request(app).post('/api/auth/resend-verification').send({ email: 'nobody@test.com' });

        expect(known.status).toBe(200);
        expect(unknown.status).toBe(200);
        expect(known.body).toEqual(unknown.body);
    });
});

describe('password reset', () => {
    beforeEach(() => jest.clearAllMocks());

    test('forgot-password emails a reset link', async () => {
        await makeUser({ email: 'reset@test.com' });

        const res = await request(app).post('/api/auth/forgot-password').send({ email: 'reset@test.com' });

        expect(res.status).toBe(200);
        expect(sendEmail).toHaveBeenCalledTimes(1);
        expect(sendEmail.mock.calls[0][0].subject).toMatch(/reset/i);
    });

    test('forgot-password does not reveal whether an address exists', async () => {
        await makeUser({ email: 'exists@test.com' });

        const known = await request(app).post('/api/auth/forgot-password').send({ email: 'exists@test.com' });
        const unknown = await request(app).post('/api/auth/forgot-password').send({ email: 'ghost@test.com' });

        expect(known.body).toEqual(unknown.body);
        expect(sendEmail).toHaveBeenCalledTimes(1);
    });

    test('the emailed token sets a new working password', async () => {
        await makeUser({ email: 'change@test.com' });
        await request(app).post('/api/auth/forgot-password').send({ email: 'change@test.com' });

        const res = await request(app)
            .patch(`/api/auth/reset-password/${tokenFrom(lastLink())}`)
            .send({ password: 'brand-new-password' });

        expect(res.status).toBe(200);
        expect(typeof res.body.token).toBe('string');

        const login = await request(app)
            .post('/api/auth/login')
            .send({ email: 'change@test.com', password: 'brand-new-password' });
        expect(login.status).toBe(200);
    });

    test('the old password stops working after a reset', async () => {
        await makeUser({ email: 'old@test.com' });
        await request(app).post('/api/auth/forgot-password').send({ email: 'old@test.com' });

        await request(app)
            .patch(`/api/auth/reset-password/${tokenFrom(lastLink())}`)
            .send({ password: 'a-different-password' });

        const login = await request(app)
            .post('/api/auth/login')
            .send({ email: 'old@test.com', password: 'password123' });
        expect(login.status).toBe(401);
    });

    test('the new password is stored hashed', async () => {
        await makeUser({ email: 'hashed@test.com' });
        await request(app).post('/api/auth/forgot-password').send({ email: 'hashed@test.com' });

        await request(app)
            .patch(`/api/auth/reset-password/${tokenFrom(lastLink())}`)
            .send({ password: 'plaintext-check' });

        const user = await User.findOne({ email: 'hashed@test.com' }).select('+password');
        expect(user.password).not.toBe('plaintext-check');
        expect(user.password).toMatch(/^\$2[aby]\$/);
    });

    test('a reset link cannot be reused', async () => {
        await makeUser({ email: 'reuse@test.com' });
        await request(app).post('/api/auth/forgot-password').send({ email: 'reuse@test.com' });
        const token = tokenFrom(lastLink());

        expect((await request(app).patch(`/api/auth/reset-password/${token}`).send({ password: 'first-password' })).status).toBe(200);
        expect((await request(app).patch(`/api/auth/reset-password/${token}`).send({ password: 'second-password' })).status).toBe(400);
    });

    test('an expired reset link is rejected', async () => {
        const { user } = await makeUser({ email: 'stale@test.com' });
        const raw = user.createPasswordResetToken();
        user.passwordResetExpires = new Date(Date.now() - 1000);
        await user.save({ validateBeforeSave: false });

        const res = await request(app)
            .patch(`/api/auth/reset-password/${raw}`)
            .send({ password: 'does-not-matter' });

        expect(res.status).toBe(400);
    });

    test('a short password is rejected', async () => {
        await makeUser({ email: 'short@test.com' });
        await request(app).post('/api/auth/forgot-password').send({ email: 'short@test.com' });

        const res = await request(app)
            .patch(`/api/auth/reset-password/${tokenFrom(lastLink())}`)
            .send({ password: 'tiny' });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/8 characters/);
    });
});

describe('registration resilience', () => {
    beforeEach(() => jest.clearAllMocks());

    test('registration still succeeds when mail delivery fails', async () => {
        sendEmail.mockRejectedValueOnce(new Error('SMTP unavailable'));

        const res = await request(app).post('/api/auth/register').send({
            fullName: 'Offline', email: 'offline@test.com', password: 'password123'
        });

        expect(res.status).toBe(201);
        expect(typeof res.body.token).toBe('string');
    });
});
