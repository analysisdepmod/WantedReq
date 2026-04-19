import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { VitePWA } from 'vite-plugin-pwa'; // ⬅️ أضف هذا
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    var baseURL = env.VITE_BASE_URL;
    var APPPORT = Number(env.VITE_APP_PORT || 5555);
    var certificateName = env.VITE_HTTPS_CERT_NAME || 'reactapp1.client';
    var baseFolder = env.APPDATA && env.APPDATA !== ''
        ? "".concat(env.APPDATA, "/ASP.NET/https")
        : "".concat(process.env.HOME, "/.aspnet/https");
    var certFilePath = path.join(baseFolder, "".concat(certificateName, ".pem"));
    var keyFilePath = path.join(baseFolder, "".concat(certificateName, ".key"));
    if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
        var result = child_process.spawnSync('dotnet', [
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
    var target = env.ASPNETCORE_HTTPS_PORT
        ? "https://localhost:".concat(env.ASPNETCORE_HTTPS_PORT)
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
                    target: target,
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
