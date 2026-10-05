import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray package-lock.json in the parent folder made Next guess the wrong project root.
  turbopack: { root: __dirname },
  poweredByHeader: false,
  // The content/*.json files are read at runtime (they seed Vercel Blob until the first Studio save).
  outputFileTracingIncludes: { "/**": ["./content/*.json"] },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // No other site may show these pages in a frame (stops click-jacking the Studio buttons).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
            : []),
        ],
      },
      {
        // Keep the Studio out of shared caches and search engines.
        source: "/studio/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
  experimental: {
    // Studio uploads several photos in one save (they're shrunk in the browser first).
    serverActions: { bodySizeLimit: "30mb" },
  },
};

export default nextConfig;
