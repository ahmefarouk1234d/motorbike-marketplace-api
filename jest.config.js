export default {
    testEnvironment: 'node',
    // The project is native ESM, so there is nothing to transpile.
    transform: {},
    // The suite shares one local MongoDB, so files must not run concurrently.
    maxWorkers: 1,
    testTimeout: 20000
};
