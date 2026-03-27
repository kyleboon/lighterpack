import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
    runtimeConfig: {
        enableTestEndpoints: process.env.ENABLE_TEST_ENDPOINTS === 'true',
    },
    modules: ['@pinia/nuxt'],
    app: {
        rootId: 'lp',
        head: {
            title: 'LighterPack',
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
        '/r/**': { ssr: true }, // share pages always SSR
        '/**': { ssr: false }, // SPA for authenticated app
    },
    css: ['~/assets/css/lighterpack.scss'],
    typescript: {
        tsConfig: {
            compilerOptions: {
                noUncheckedIndexedAccess: false,
            },
        },
    },
});
