import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

export default [
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node,
            },
        },
        plugins: {
            import: importPlugin,
            'unused-imports': unusedImports,
        },
        rules: {
            'no-undef': 'error',
            'no-unused-vars': ['error', { vars: 'all', args: 'after-used', ignoreRestSiblings: false, argsIgnorePattern: '^_' }],
            // Reglas de Importación
            'import/no-unresolved': ['error', { commonjs: true, caseSensitive: true }],
            'import/no-duplicates': 'error',
            'import/newline-after-import': 'error',
            'import/extensions': ['error', 'always', { js: 'always', json: 'always' }],

            // Reglas para imports no usados
            'unused-imports/no-unused-imports': 'error',

            // Otras reglas propuestas para el usuario
            'no-console': 'off', // Solemos usar console en backend, pero se puede discutir
            'prefer-const': 'error',
            'no-var': 'error',
            'eqeqeq': ['error', 'always'],
            'curly': ['error', 'all'],
            'semi': ['error', 'always'],
            'quotes': ['error', 'single', { avoidEscape: true }],
        },
        settings: {
            'import/resolver': {
                node: {
                    extensions: ['.js', '.json'],
                },
            },
        },
    },
    {
        files: ['packages/mc-frontend/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
    },
    {
        ignores: [
            'node_modules/**',
            '**/node_modules/**',
            'dist/**',
            'scripts/lint-imports.js', // Lo borraremos pronto
        ],
    },
];
