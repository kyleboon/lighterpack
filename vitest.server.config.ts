import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '#shared': resolve(__dirname, 'shared'),
            '#imports': resolve(__dirname, 'test/server/__mocks__/imports.ts'),
        },
    },
    test: {
        environment: 'node',
        include: ['test/server/**/*.spec.ts'],
        setupFiles: ['test/server/setup.ts'],
        globals: true,
    },
});
