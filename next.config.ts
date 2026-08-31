import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * Path aliases for local/dev (host-agnostic).
 * Production host routing (apex → internal.*, clean internal URLs) lives in middleware.
 */
const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  serverExternalPackages: ["jspdf", "pptxgenjs"],
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
    // Server production bundles were emitting ~148 MB of .js.map files into
    // .next/server, bloating the Vercel deployment output and causing ENOSPC.
    // Server source maps are debug-only and not needed at runtime.
    serverSourceMaps: false,
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
    "/api/wolf/map-geography": ["./public/geo/wolf/southern-east-africa-countries.geojson"],
    "/api/saec/installations/map-geography": [
      "./public/geo/saec/south-africa-country.geojson",
      "./public/geo/saec/south-africa-provinces.geojson",
    ],
    "/api/demo/board-deck": ["./public/samples/**"],
    "/api/abhi/board-deck": [
      "./public/images/workspaces/abhi-logo.png",
      "./public/images/workspaces/abhi.jpg",
    ],
    "/api/talanton/board-deck": [
      "./public/images/workspaces/talantonimpact-logo.png",
      "./public/images/talanton/harry-turner.jpg",
    ],
    "/api/executive-assistant/**": [
      "./public/images/workspaces/abhi-logo.png",
      "./public/images/workspaces/abhi.jpg",
      "./public/images/workspaces/northstar-logo.png",
      "./public/images/workspaces/northstar-logo-print.jpg",
      "./public/images/workspaces/talantonimpact-logo.png",
      "./public/images/workspaces/onwardair-logo.png",
      "./public/images/workspaces/onwardair-logo-dark.png",
      "./public/images/talanton/harry-turner.jpg",
      "./public/samples/**",
    ],
  },
  outputFileTracingExcludes: {
    "*": [
      // Static assets are deployed separately via public/ — must not be duplicated into every serverless trace.
      "public/**",
      "**/*.map",
      "node_modules/playwright/**",
      "node_modules/@playwright/**",
      "node_modules/@esbuild/**",
      "node_modules/webpack/**",
      "node_modules/terser/**",
      "node_modules/@img/sharp-wasm32/**",
      // Vercel Node functions run on glibc Amazon Linux; musl SWC/sharp binaries are unused duplicates.
      "node_modules/@next/swc-linux-x64-musl/**",
      "node_modules/@img/sharp-linuxmusl-x64/**",
      "docs/**",
      "mobile-android/**",
      "tmp/**",
      "backups/**",
    ],
  },
};

const sentryUploadEnabled = Boolean(
  process.env.SENTRY_AUTH_TOKEN?.trim() &&
    process.env.SENTRY_ORG?.trim() &&
    process.env.SENTRY_PROJECT?.trim(),
);

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: !sentryUploadEnabled,
    deleteSourcemapsAfterUpload: true,
  },
});
