module.exports = {
    roots: [
        "<rootDir>/test"
    ],
    testRegex: 'test/(.+)\\.test\\.(jsx?|tsx?)$',
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    "transformIgnorePatterns": [
        "/node_modules/(?!core)"
    ],
    moduleNameMapper: {
        '^core/(.*)$': '<rootDir>/../core/$1',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
