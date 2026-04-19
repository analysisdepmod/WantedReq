import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { VitePWA } from 'vite-plugin-pwa'; // ⬅️ أضف هذا

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    const baseURL = env.VITE_BASE_URL;
    const APPPORT = Number(env.VITE_APP_PORT || 5555);
    const certificateName = env.VITE_HTTPS_CERT_NAME || 'reactapp1.client';

    const baseFolder =
        env.APPDATA && env.APPDATA !== ''
            ? `${env.APPDATA}/ASP.NET/https`
            : `${process.env.HOME}/.aspnet/https`;

    const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
    const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

    if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
        const result = child_process.spawnSync('dotnet', [
            'dev-certs',
            'https',
            '--export-path',
            certFilePath,
            '--format',
            'Pem',
            '--no-password',
        ], { stdio: 'inherit' });

        if (result.status !== 0) {
            throw new Error('Could not create HTTPS certificate.');
        }
    }

    const target = env.ASPNETCORE_HTTPS_PORT
        ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}`
        : env.ASPNETCORE_URLS
            ? env.ASPNETCORE_URLS.split(';')[0]
            : baseURL;

    return {
        plugins: [
            plugin(),
            VitePWA({
                registerType: 'autoUpdate',
                includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'robots.txt'],
                workbox: {
                    maximumFileSizeToCacheInBytes: 10 * 1024 * 1024 // ⬅️ رفع الحد إلى 10 ميغابايت
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
                            type: 'image/png'
                        },
                        {
                            src: 'pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png'
                        }
                    ]
                }
            })
        ],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },
        server: {
            proxy: {
                '^/api': {
                    target,
                    secure: false,
                }
            },
            port: APPPORT,
            https: {
                key: fs.readFileSync(keyFilePath),
                cert: fs.readFileSync(certFilePath),
            }
        }
    };
});
