import type { NextConfig } from "next";

/**
 * Path aliases for local/dev (host-agnostic).
 * Production host routing (apex → internal.*, clean internal URLs) lives in middleware.
 */
const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  async redirects() {
    // Public destinations must be /dashboard?... so customer-host middleware can
    // authenticate and keep Talanton externals out of the admin shell.
    // Never send browsers to /internaldashboard (implementation path only).
    return [
      { source: "/testflighthub", destination: "/dashboard", permanent: true },
      { source: "/testflighthub/:path*", destination: "/dashboard", permanent: true },
      { source: "/crm", destination: "/dashboard?view=crm", permanent: false },
      { source: "/financials", destination: "/dashboard?view=financials", permanent: false },
      { source: "/messaging", destination: "/dashboard?view=messaging", permanent: false },
      { source: "/calendar", destination: "/dashboard?view=calendar", permanent: false },
      { source: "/info-email", destination: "/dashboard?view=info-email", permanent: false },
      { source: "/projects", destination: "/dashboard?view=projects", permanent: false },
      { source: "/files", destination: "/dashboard?view=files", permanent: false },
      { source: "/users", destination: "/dashboard?view=users", permanent: false },
      { source: "/telemetry", destination: "/dashboard?view=telemetry", permanent: false },
      { source: "/executive-assistant", destination: "/dashboard?view=executive-assistant", permanent: true },
      { source: "/client-onboarding", destination: "/dashboard?view=client-onboarding", permanent: true },
      {
        source: "/corporate-information/cap-table",
        destination: "/dashboard?view=corporate-cap-table",
        permanent: true,
      },
      {
        source: "/internaldashboard",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/internaldashboard/",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/internaldashboard/executive-assistant",
        destination: "/dashboard?view=executive-assistant",
        permanent: true,
      },
      {
        source: "/internaldashboard/client-onboarding",
        destination: "/dashboard?view=client-onboarding",
        permanent: true,
      },
      {
        source: "/internaldashboard/corporate-information/cap-table",
        destination: "/dashboard?view=corporate-cap-table",
        permanent: true,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },
  // Architecture diagram live-seeds read these at runtime on Vercel (docs/ is otherwise excluded).
  outputFileTracingIncludes: {
    "/api/architecture-diagrams": [
      "./docs/VERCEL_ARCHITECTURE.md",
      "./docs/GITHUB_ARCHITECTURE.md",
      "./docs/WORKSPACE_ARCHITECTURE.md",
      "./docs/EXECUTIVE_AI_PLATFORM.md",
    ],
    "/api/unit311-details": [
      "./docs/VERCEL_ARCHITECTURE.md",
      "./docs/GITHUB_ARCHITECTURE.md",
      "./docs/WORKSPACE_ARCHITECTURE.md",
      "./docs/EXECUTIVE_AI_PLATFORM.md",
    ],
    "/api/internal/bootstrap-architecture-diagrams": [
      "./docs/VERCEL_ARCHITECTURE.md",
      "./docs/GITHUB_ARCHITECTURE.md",
      "./docs/WORKSPACE_ARCHITECTURE.md",
      "./docs/EXECUTIVE_AI_PLATFORM.md",
    ],
  },
  outputFileTracingExcludes: {
    "*": [
      "node_modules/playwright/**",
      "node_modules/@playwright/**",
      "node_modules/@esbuild/**",
      "node_modules/webpack/**",
      "node_modules/terser/**",
      "docs/**",
      "mobile-android/**",
      "tmp/**",
      "backups/**",
    ],
  },
};

export default nextConfig;
