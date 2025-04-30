export default {
    testEnvironment: 'node', 
    transform: {'^.+\\.js$': 'babel-jest',},
    moduleFileExtensions: ['js', 'json'],
    testMatch: ['**/src/tests/unit_tests/*.test.js'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['json', 'lcov', 'text', 'clover'],
};