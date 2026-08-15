import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import createBundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const withBundleAnalyzer = createBundleAnalyzer({
  // Only open the HTML report when ANALYZE=true; normal builds are unaffected.
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Perf (config-safe): keep client source maps out of the production deploy (explicit; already the
  // Next default). `compress` is intentionally left at its default — on Vercel the edge/CDN applies
  // brotli, so an explicit `compress` is a no-op there.
  // NOTE: optimizePackageImports for lucide-react was tested and REVERTED — it increased the Turbopack
  // bundle (+2.8%) rather than shrinking it (lucide-react v1.28 is already ESM-modular; the transform
  // added chunk overhead). Evidence: plans/260815-1104-performance-audit-and-improve/evidence/.
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      // Google OAuth avatars (user_metadata.picture / avatar_url)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // Dicebear avatars used by seeded/dev users
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
    // Dicebear serves SVG; next/image refuses SVG unless explicitly allowed.
    // Mitigations for untrusted SVG (dicebear is allowlisted above): force
    // attachment disposition and a locked-down CSP so no embedded script runs.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
