import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';

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
        ignores: ['public/dist/**', 'public/js/**', 'node_modules/**'],
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
                bus: 'readonly',
                fetchJson: 'readonly',
                require: 'readonly',
                module: 'writable',
                exports: 'writable',
            },
        },
        rules: {
            ...sharedRules,
            ...prettier.rules,
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        },
    },
    // Unit test files
    {
        files: ['test/unit/**/*.spec.{js,ts}'],
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
                bus: 'readonly',
                fetchJson: 'readonly',
                require: 'readonly',
                module: 'writable',
                exports: 'writable',
            },
        },
        rules: {
            ...sharedRules,
            ...prettier.rules,
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'vue/max-attributes-per-line': 'off',
            'vue/multi-word-component-names': 'off',
            'vue/require-prop-types': 'off',
            'vue/require-explicit-emits': 'off',
        },
    },
];
