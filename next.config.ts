import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import createBundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const withBundleAnalyzer = createBundleAnalyzer({
  // Only open the HTML report when ANALYZE=true; normal builds are unaffected.
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
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
