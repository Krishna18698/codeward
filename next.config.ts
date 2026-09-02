import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection",          value: "1; mode=block" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Keep visited mode tabs in the client router cache briefly, so switching
    // back to a recently-viewed tab is instant instead of re-fetching.
    staleTimes: { dynamic: 30, static: 180 },
    // Tree-shake the CodeMirror barrels so only the pieces the editor uses ship
    // (lucide-react is already in Next's default optimize list).
    optimizePackageImports: [
      "@codemirror/view",
      "@codemirror/state",
      "@codemirror/language",
      "@codemirror/commands",
    ],
  },
  // Dev-only: allow tunnel/LAN origins to load /_next/* assets when testing
  // on other devices. Ignored entirely in production builds.
  allowedDevOrigins: ["192.168.0.6", "dodge-subarctic-snap.ngrok-free.dev"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
