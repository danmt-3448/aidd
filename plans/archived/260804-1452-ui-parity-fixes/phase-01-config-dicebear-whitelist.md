# Phase 01 — next/image dicebear whitelist (CRITICAL, foundation)

**Track:** B · **Priority:** CRITICAL · **Status:** pending · **blockedBy:** —
**Blocks:** phase-10 (re-audit of homepage/board/profile).

## Context
- Source: `plans/reports/reviewer-260804-ui-parity-audit.md` §3.
- `homepage`, `board`, `profile` crash at every breakpoint: `Invalid src prop
  (https://api.dicebear.com/...) on next/image — hostname "api.dicebear.com" is not configured`.
- `dicebear` does NOT appear in `src/`. The URL comes from seed data: `profiles.avatar_url`,
  written by `supabase/seed-auth-users.mjs:33` →
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`.
- `next.config.ts` only whitelists `lh3.googleusercontent.com`.
- Prod (Google avatars) is unaffected; demo/E2E/seed envs crash.

## Requirements
- Functional: any `profiles.avatar_url` rendered via `next/image` must load without runtime error.
- Non-functional: no regression to Google-avatar path; no new external hosts beyond what seed needs.

## Data flow
Seed script writes avatar_url → DB → server query → `<Image src={avatar_url}>` → next/image host allowlist check → render.
Fix opens the allowlist gate for the seed host.

## Related code files
- Modify: `next.config.ts` — add dicebear to `images.remotePatterns`.
- Read (context only): `supabase/seed-auth-users.mjs` (confirms host + path shape).

## Implementation steps
1. In `next.config.ts` `images.remotePatterns`, append:
   `{ protocol: 'https', hostname: 'api.dicebear.com' }`.
2. Restart dev server (Next caches image config); confirm homepage renders seed avatars.
3. Do NOT change the seed host in this phase — whitelisting is the minimal, prod-safe fix (KISS).
   (Alternative of re-seeding avatars is heavier and not required; leave seed as-is.)

## Todo
- [ ] Add dicebear remotePattern to `next.config.ts`
- [ ] Restart dev, load `/`, `/board`, `/profile` — no crash
- [ ] Confirm Google-avatar path still renders (no regression)

## Acceptance criteria (binary)
- [ ] `next.config.ts` `images.remotePatterns` contains an entry with `hostname: 'api.dicebear.com'`, `protocol: 'https'`.
- [ ] `/`, `/board`, `/profile` load at 1280 with zero `Invalid src prop` console/runtime errors.
- [ ] Existing `lh3.googleusercontent.com` pattern is still present.
- [ ] `npm run build` succeeds.

## Risk assessment
- **Low.** Config-only change. Risk: forgetting to restart dev → stale config appears to "not work".
  Mitigation: step 2 explicit restart.

## Security considerations
- Adds one trusted external image host (dicebear public API, SVG avatars). No auth/data exposure.

## Next steps
- Unblocks phase-10 (re-capture + audit the 3 previously-crashing screens).
