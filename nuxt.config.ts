import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
    runtimeConfig: {
        enableTestEndpoints: process.env.ENABLE_TEST_ENDPOINTS === 'true',
        disableRateLimiting: process.env.DISABLE_RATE_LIMITING === 'true',
    },
    modules: ['@pinia/nuxt', '@nuxtjs/seo'],
    site: {
        url: process.env.PUBLIC_URL || 'http://localhost:3000',
        name: 'BaseWeight',
    },
    app: {
        rootId: 'bw',
        head: {
            htmlAttrs: { lang: 'en' },
            title: 'BaseWeight',
            meta: [
                { charset: 'utf-8' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                { name: 'description', content: 'Track your gear weight for hiking, backpacking, and adventures' },
            ],
        },
    },
    robots: {
        disallow: ['/', '/signin', '/api/'],
        allow: ['/welcome', '/r/'],
    },
    sitemap: {
        excludeAppSources: true,
    },
    ogImage: {
        defaults: {
            width: 1200,
            height: 630,
        },
    },
    nitro: {
        alias: {
            '#shared': resolve(__dirname, 'shared'),
        },
        externals: {
            external: ['better-sqlite3'],
        },
    },
    vite: {
        resolve: {
            alias: {
                '#shared': resolve(__dirname, 'shared'),
            },
        },
    },
    ssr: true,
    routeRules: {
        '/welcome': { ssr: true },
        '/r/**': { ssr: true },
        '/**': { ssr: false },
    },
    css: ['~/assets/css/baseweight.css'],
    typescript: {
        tsConfig: {
            compilerOptions: {
                noUncheckedIndexedAccess: false,
            },
        },
    },
});
