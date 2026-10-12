/** @type {import('next').NextConfig} */
//
// The app can run as two instances:
//   main  (default)      -> consumer + partner surfaces on :3000
//   admin  ADMIN_PORTAL=1 -> /dashboard/admin surfaces on :3001
// Each instance gets its own .next build dir so they can run concurrently.
const isAdminPortal = process.env.ADMIN_PORTAL === "1";

// Opt-in bundle visualiser: `ANALYZE=true npm run build`. Dev and
// normal production builds are unaffected.
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

const nextConfig = {
  transpilePackages: ["@urbanexplore/shared", "@urbanexplore/database"],
  output: "standalone",
  poweredByHeader: false,
  distDir: isAdminPortal ? ".next-admin" : ".next",
  images: {
    remotePatterns: [
      // Supabase Storage / project assets
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
