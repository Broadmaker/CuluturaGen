/** @type {import('next').NextConfig} */
// @sentry/nextjs is CommonJS: default-import interop in this ESM config.
import pkg from "@sentry/nextjs";
const { withSentryConfig } = pkg;

const nextConfig = {
  reactStrictMode: true,
  // Rendering hygiene: no X-Powered-By fingerprint, default compression on.
  poweredByHeader: false,
  compress: true,
  // Standalone server output (.next/standalone/server.js) for host-Node deploys.
  output: 'standalone',
  experimental: {
    instrumentationHook: true,
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

// Sentry build wrapping only when a DSN is configured — default builds stay
// byte-identical and fast. No SENTRY_AUTH_TOKEN here: no sourcemap upload.
const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
export default sentryDsn
  ? withSentryConfig(nextConfig, { silent: true, widenClientFileUpload: false })
  : nextConfig;