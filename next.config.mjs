/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Rendering hygiene: no X-Powered-By fingerprint, default compression on.
  poweredByHeader: false,
  compress: true,
  // Standalone server output (.next/standalone/server.js) for host-Node deploys.
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  // Production hardening (md/09 §113, md/10 §153): safe defaults. TLS itself
  // terminates at the reverse proxy; HSTS is ignored on plain-http localhost.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
};

export default nextConfig;
