import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Santa Biblia',
        short_name: 'Santa Biblia',
        description: 'Lectura bíblica para el estudio devocional',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        lang: 'es',
        icons: [
          {
            src: 'pwa-192x192.png?v=7',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png?v=7',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-maskable-512x512.png?v=7',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,webmanifest}',
          'data/books.json',
          'data/versions.json',
        ],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /\/(?:assets|images)\/.*\.(?:webp|jpg|png)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-images-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: /\/data\/.*\.json$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'bible-data-cache',
              expiration: {
                maxEntries: 320,
                maxAgeSeconds: 60 * 60 * 24 * 90
              }
            }
          }
        ]
      }
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['e2e/**'],
  },
})
