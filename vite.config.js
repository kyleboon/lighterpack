import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

function assetsJsonPlugin() {
    return {
        name: 'assets-json',
        writeBundle(options, bundle) {
            const assets = { files: { app: [], share: [] } };

            for (const [fileName, chunk] of Object.entries(bundle)) {
                if (chunk.type === 'chunk' && chunk.isEntry) {
                    if (chunk.name === 'lighterpack') {
                        assets.files.app.push(fileName);
                        if (chunk.viteMetadata && chunk.viteMetadata.importedCss) {
                            chunk.viteMetadata.importedCss.forEach(css => assets.files.app.push(css));
                        }
                    } else if (chunk.name === 'share') {
                        assets.files.share.push(fileName);
                        if (chunk.viteMetadata && chunk.viteMetadata.importedCss) {
                            chunk.viteMetadata.importedCss.forEach(css => assets.files.share.push(css));
                        }
                    }
                } else if (chunk.type === 'asset' && fileName.endsWith('.css')) {
                    // Handle CSS assets emitted separately
                    if (!assets.files.app.includes(fileName) && !assets.files.share.includes(fileName)) {
                        assets.files.app.push(fileName);
                    }
                }
            }

            writeFileSync('public/dist/assets.json', JSON.stringify(assets));
        },
    };
}

export default defineConfig({
    plugins: [vue(), assetsJsonPlugin()],
    root: '.',
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
            },
        },
    },
    build: {
        outDir: 'public/dist',
        emptyOutDir: true,
        commonjsOptions: {
            include: [/node_modules/, /client\//],
            transformMixedEsModules: true,
        },
        rollupOptions: {
            input: {
                lighterpack: resolve(__dirname, 'client/lighterpack.js'),
                share: resolve(__dirname, 'public/js/share.js'),
            },
            output: {
                entryFileNames: '[name].[hash].js',
                chunkFileNames: '[name].[hash].js',
                assetFileNames: '[name].[hash].[ext]',
            },
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/signin': { target: 'http://localhost:3000', changeOrigin: true },
            '/register': { target: 'http://localhost:3000', changeOrigin: true },
            '/saveLibrary': { target: 'http://localhost:3000', changeOrigin: true },
            '/account': { target: 'http://localhost:3000', changeOrigin: true },
            '/delete-account': { target: 'http://localhost:3000', changeOrigin: true },
            '/forgotPassword': { target: 'http://localhost:3000', changeOrigin: true },
            '/forgotUsername': { target: 'http://localhost:3000', changeOrigin: true },
            '/externalId': { target: 'http://localhost:3000', changeOrigin: true },
            '/imageUpload': { target: 'http://localhost:3000', changeOrigin: true },
            '/moderation': { target: 'http://localhost:3000', changeOrigin: true },
            '/r': { target: 'http://localhost:3000', changeOrigin: true },
            '/e': { target: 'http://localhost:3000', changeOrigin: true },
            '/csv': { target: 'http://localhost:3000', changeOrigin: true },
        },
    },
    resolve: {
        alias: {
            vue: 'vue/dist/vue.esm-bundler.js',
        },
    },
});
