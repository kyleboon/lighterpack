import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';
import tsParser from '@typescript-eslint/parser';

const sharedRules = {
    'consistent-return': 'error',
    'func-names': 'off',
    'max-len': 'off',
    'no-shadow': 'error',
    'no-param-reassign': ['error', { props: false }],
    'no-plusplus': 'off',
    'prefer-destructuring': 'off',
    'no-underscore-dangle': 'off',
    'no-restricted-syntax': 'off',
};

export default [
    {
        ignores: ['public/dist/**', 'public/js/**', 'node_modules/**', '.output/**', '.nuxt/**'],
    },
    // Server/Node files
    {
        files: ['app.js', 'server/**/*.js', 'scripts/**/*.js'],
        ...js.configs.recommended,
        languageOptions: {
            ecmaVersion: 2022,
            globals: {
                require: 'readonly',
                module: 'writable',
                exports: 'writable',
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                Buffer: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
            },
        },
        rules: {
            ...sharedRules,
            ...prettier.rules,
        },
    },
    // Client JS files (ESM + browser)
    {
        files: ['client/**/*.js'],
        ...js.configs.recommended,
        languageOptions: {
            ecmaVersion: 2022,
            globals: {
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                localStorage: 'readonly',
                location: 'readonly',
                FormData: 'readonly',
                fetch: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                FileReader: 'readonly',
                Image: 'readonly',
                require: 'readonly',
                module: 'writable',
                exports: 'writable',
            },
        },
        rules: {
            ...sharedRules,
            ...prettier.rules,
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
        },
    },
    // Unit test files (JavaScript)
    {
        files: ['test/unit/**/*.spec.js'],
        ...js.configs.recommended,
        languageOptions: {
            ecmaVersion: 2022,
            globals: {
                require: 'readonly',
                module: 'writable',
                exports: 'writable',
                console: 'readonly',
            },
        },
        rules: {
            ...sharedRules,
            ...prettier.rules,
        },
    },
    // Unit test files (TypeScript) — uses TS parser to handle type annotations
    {
        files: ['test/unit/**/*.spec.ts', 'test/server/**/*.spec.ts'],
        ...js.configs.recommended,
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2022,
            globals: {
                require: 'readonly',
                module: 'writable',
                exports: 'writable',
                console: 'readonly',
            },
        },
        rules: {
            ...sharedRules,
            ...prettier.rules,
            // TS parser doesn't understand some JS-specific rules; disable rules
            // that conflict with TypeScript's own checks.
            'no-unused-vars': 'off',
            'no-undef': 'off',
        },
    },
    // Vue files — apply vue plugin rules on top of js recommended
    ...pluginVue.configs['flat/recommended'].map((config) => ({
        ...config,
        files: ['client/**/*.vue'],
    })),
    {
        files: ['client/**/*.vue'],
        languageOptions: {
            ecmaVersion: 2022,
            globals: {
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                localStorage: 'readonly',
                location: 'readonly',
                FormData: 'readonly',
                fetch: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                FileReader: 'readonly',
                Image: 'readonly',
                require: 'readonly',
                module: 'writable',
                exports: 'writable',
            },
        },
        rules: {
            ...sharedRules,
            ...prettier.rules,
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
            'vue/max-attributes-per-line': 'off',
            'vue/multi-word-component-names': 'off',
            'vue/require-prop-types': 'error',
            'vue/require-explicit-emits': 'error',
        },
    },
];
