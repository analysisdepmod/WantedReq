import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import child_process from 'node:child_process';
import type { ServerOptions } from 'node:https';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    const baseURL = env.VITE_BASE_URL || 'https://localhost:7067';
    const APPPORT = Number(env.VITE_APP_PORT || 5555);
    const certificateName = env.VITE_HTTPS_CERT_NAME || 'reactapp1.client';
    const useHttps = env.VITE_USE_HTTPS === 'true';

    const baseFolder =
        env.APPDATA && env.APPDATA !== ''
            ? path.join(env.APPDATA, 'ASP.NET', 'https')
            : path.join(process.env.HOME || '', '.aspnet', 'https');

    const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
    const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

    let httpsConfig: ServerOptions | undefined = undefined;

    if (useHttps) {
        if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
            const result = child_process.spawnSync(
                'dotnet',
                [
                    'dev-certs',
                    'https',
                    '--export-path',
                    certFilePath,
                    '--format',
                    'Pem',
                    '--no-password',
                ],
                { stdio: 'inherit' }
            );

            if (result.status !== 0) {
                throw new Error('Could not create HTTPS certificate.');
            }
        }

        httpsConfig = {
            key: fs.readFileSync(keyFilePath),
            cert: fs.readFileSync(certFilePath),
        };
    }

    const target = env.ASPNETCORE_HTTPS_PORT
        ? `https://10.198.223.13:${env.ASPNETCORE_HTTPS_PORT}`
        : env.ASPNETCORE_URLS
            ? env.ASPNETCORE_URLS.split(';')[0]
            : baseURL;
 
    return {
        plugins: [
            react(),
            VitePWA({
                disable: mode !== 'production',
                registerType: 'autoUpdate',
                includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'robots.txt'],
                workbox: {
                    maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
                },
                manifest: {
                    name: 'My React ASP.NET App',
                    short_name: 'MyApp',
                    description: 'React + Vite + ASP.NET Progressive Web App',
                    theme_color: '#ffffff',
                    background_color: '#ffffff',
                    display: 'standalone',
                    start_url: '/',
                    icons: [
                        {
                            src: 'pwa-192x192.png',
                            sizes: '192x192',
                            type: 'image/png',
                        },
                        {
                            src: 'pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png',
                        },
                    ],
                },
            }),
        ],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        server: {
            host: true,
            port: APPPORT,
            strictPort: true,
            https: httpsConfig,
            proxy: {
                '^/api': {
                    target,
                    secure: false,
                    changeOrigin: true,
                },
            },
        },
    };
});