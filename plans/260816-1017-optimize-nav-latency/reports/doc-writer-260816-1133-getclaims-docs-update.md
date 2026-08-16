# Doc-Writer Report — getClaims middleware docs update · 260816

**Triggered by:** Phase 06 ship — `updateSession()` getClaims local verify.

---

## Verdict: updated 3 files

### 1. `docs/system-architecture.md`

**Module Map (line 101):** `middleware.ts` description expanded from
`updateSession() — refreshes Supabase session in proxy`
to include the mechanism: getClaims local ES256/JWKS verify (~1–6ms) + getUser network fallback.

**Route Guard data-flow (line 141):** `updateSession(request) // refresh Supabase session cookie`
comment replaced with three-line detail:
- getClaims local verify path
- getUser network fallback path (expired/absent claims)
- cookie sync / token refresh clarification (happens on fallback path only)

Route-guard _behavior_ description (steps 2 + 3, redirects, pre-launch gate) is **unchanged** — correct.

### 2. `docs/project-changelog.md`

Added entry under `[Unreleased]` as a new `### Performance — 2026-08-16` block (ahead of the existing Performance block from 2026-08-06):
- What changed: `getUser()` → `getClaims()` in `updateSession()`
- Numbers: 24–134ms/call → 1–6ms/call
- Fallback path: getUser on missing/expired/errored claims
- Behavior unchanged note
- Security trade-off: revoked/banned user valid until token TTL

### 3. `docs/performance-guidelines.md`

Added one checked item `[x]` to the FE Checklist (§2) documenting that middleware auth round-trips are now eliminated. Marked `[x]` (done) with a note that no budget action is needed unless getClaims is reverted.

---

## Files NOT changed

| File | Reason |
|---|---|
| `CLAUDE.md` | Describes `updateSession()` only as "refresh Supabase cookie session" (proxy order step 1). Order and behavior unchanged — no edit needed. |
| `docs/code-standards.md` | `getUser()` reference is for server action auth guards (not middleware) — correct and untouched. |
| `docs/development-roadmap.md` | No mention of getUser / updateSession mechanism. |
| `docs/api-by-screen.md`, `docs/api-shared.md`, `docs/database-schema.md` | No route-guard or middleware auth content. |

---

**Status:** DONE
**Summary:** 3 docs updated surgically. System architecture now accurately describes getClaims local verify + getUser fallback; changelog records the perf/security trade-off; performance guidelines marks middleware auth cost as solved.
