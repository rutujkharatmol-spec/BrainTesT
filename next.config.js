const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',

  // Activate a new service worker as soon as it is installed instead of
  // waiting for every tab to close. Without this an installed PWA can keep
  // executing a previous build against a newly deployed server, which
  // produces errors that do not exist in the current source.
  register: true,
  skipWaiting: true,

  workboxOptions: {
    disableDevLogs: true,
    clientsClaim: true,
    // API responses must never be served from cache. Authentication and
    // submissions are strictly network-only; a cached POST response or a
    // stale auth reply is always wrong.
    runtimeCaching: [
      {
        urlPattern: /^\/api\/.*/i,
        handler: 'NetworkOnly',
        method: 'GET',
        options: { cacheName: 'api-no-cache' },
      },
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
        handler: 'NetworkOnly',
        options: { cacheName: 'api-no-cache' },
      },
      {
        // Never cache the admin portal.
        urlPattern: ({ url }) => url.pathname.startsWith('/admin'),
        handler: 'NetworkOnly',
        options: { cacheName: 'admin-no-cache' },
      },
      {
        // Hashed build assets are immutable and safe to cache aggressively.
        urlPattern: /\/_next\/static\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-static',
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        // Pages: prefer the network so a new deploy is picked up immediately,
        // but fall back to cache so the app still works offline in the field.
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages',
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Surfaced in the UI so a stale client is immediately identifiable.
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || String(Date.now()),
  },
};

module.exports = withPWA(nextConfig);
