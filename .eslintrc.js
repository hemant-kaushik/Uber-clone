module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    rules: {
        semi: ["error", "always"],
        quotes: ["error", "double"],
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-explicit-any": 1,

        "@typescript-eslint/no-inferrable-types": ["warn", {
            ignoreParameters: true,
        }],

        "@typescript-eslint/no-unused-vars": "warn",
    },
}; 