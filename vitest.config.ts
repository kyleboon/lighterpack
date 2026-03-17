import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
    plugins: [vue()],
    define: {
        global: 'globalThis',
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
            },
        },
    },
    resolve: {
        alias: {
            vue: 'vue/dist/vue.esm-bundler.js',
            '~': resolve(__dirname, 'app'),
        },
    },
    test: {
        environment: 'jsdom',
        include: ['test/unit/**/*.spec.{js,ts}'],
        setupFiles: ['test/unit/setup.ts'],
        globals: true,
    },
});
