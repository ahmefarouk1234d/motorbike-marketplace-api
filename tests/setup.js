import mongoose from 'mongoose';
import { beforeAll, afterEach, afterAll } from '@jest/globals';

// Importing this module registers the hooks for whichever test file pulls it in,
// which avoids needing a global setupFiles entry.

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ||= 'test-secret';
process.env.JWT_EXPIRES_IN ||= '1h';

const TEST_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1/motorbike-marketplace-test';

beforeAll(async () => {
    await mongoose.connect(TEST_URI);
});

afterEach(async () => {
    // Wiping between tests keeps each one independent of ordering.
    const { collections } = mongoose.connection;
    for (const name of Object.keys(collections)) {
        await collections[name].deleteMany({});
    }
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
});
