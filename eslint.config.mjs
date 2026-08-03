import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Takumi Agent Kit files (hooks/skills/tests) — tooling, not product source.
    ".claude/**",
    // Supabase CLI generated cache (minified edge-runtime bundle) — not source.
    "supabase/.temp/**",
  ]),
  {
    // Vitest setup legitimately uses require() inside vi.mock() factories,
    // which are hoisted above ES imports — require is the safe pattern here.
    files: ["vitest.setup.ts"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    // Allow `_`-prefixed throwaways (destructured-but-unused, placeholder args).
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
]);

export default eslintConfig;
