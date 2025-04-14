export default {
    testEnvironment: 'node', 
    transform: {'^.+\\.js$': 'babel-jest',},
    moduleFileExtensions: ['js', 'json'],
    testMatch: ['**/src/tests/*.test.js'],
};