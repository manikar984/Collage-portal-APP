/** @type {import('next').NextConfig} */
const nextConfig = {
  // The hosted preview is not localhost. Patched Next.js rejects
  // cross-origin dev assets unless the preview host is allowed.
  allowedDevOrigins: ["*.e2b.app", "*.e2b.dev"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", "value": "no-store" },
          { key: "X-Content-Type-Options", "value": "nosniff" },
          { key: "Referrer-Policy", "value": "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
