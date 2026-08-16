# Performance Guidelines — AIDD (SAA 2025)

Standard + flow for checking and holding performance across **FE (Next.js 16)** and **BE (Supabase)**,
both **local** and **production**. This is the reusable rule set; a one-off audit runs against it and
lands a report in `plans/reports/`.

> Kit has **no dedicated perf skill**. This doc wires existing tools into a flow:
> `automate-browser` (browser/Lighthouse), `debug-code`/debugger (diagnose slow paths),
> `review-code`/reviewer (static perf anti-patterns), `auto-research` (optimize one metric via loop).

---

## 1. Performance Budgets (pass/fail targets)

### FE — Core Web Vitals (prod, mid-tier mobile / Fast 3G throttle)
| Metric | Good | Needs work | Fail |
|--------|------|-----------|------|
| LCP (Largest Contentful Paint) | ≤ 2.5s | 2.5–4s | > 4s |
| INP (Interaction to Next Paint) | ≤ 200ms | 200–500ms | > 500ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | 0.1–0.25 | > 0.25 |
| TTFB | ≤ 0.8s | 0.8–1.8s | > 1.8s |

### FE — Bundle (from `next build`)
| Item | Target |
|------|--------|
| First Load JS per route | ≤ 200 KB (warn), ≤ 300 KB (hard) |
| Shared chunk | ≤ 120 KB |
| Heavy client lib (Tiptap) | lazy-loaded, not in shared chunk |
| Lighthouse Performance score | ≥ 90 (prod) |

### BE — Supabase / Postgres
| Item | Target |
|------|--------|
| Single query (indexed) p95 | ≤ 50ms local / ≤ 150ms prod (free tier) |
| Any sequential scan on hot table | 0 (must use index) |
| FK columns used in filters/joins | indexed |
| RLS policy per-row cost | no correlated subquery without index support |
| Realtime payload | only needed columns published |

---

## 2. FE Checklist

- [ ] `next build` — inspect First Load JS per route; no route over hard cap.
- [ ] **Client/Server boundary** — is `'use client'` justified? Push data-fetching + static markup to Server Components. (Baseline: 89 client comps as of 2026-08-06 — audit for over-use.)
- [ ] **Tiptap** (kudo editor) — dynamically imported (`next/dynamic`, `ssr:false`), not shipped on routes that don't edit.
- [ ] Images via `next/image`; fonts via `next/font` (no layout shift, no render-block).
- [ ] TanStack Query — sensible `staleTime`; no refetch storms; not duplicating Server Component data.
- [ ] No large sync work on the main thread (sanitize-html, mention parsing) blocking INP.
- [ ] Route segment config correct (static where possible; `dynamic` only where needed).
- [x] **Middleware auth cost** — `updateSession()` uses `getClaims()` local JWKS verify (~1–6ms);
  `getUser()` network fallback only on expired/absent claims. Per-request auth round-trip (~40–130ms)
  is eliminated. No budget action needed unless `getClaims` is reverted.

## 3. BE Checklist

- [ ] **Index every FK + every column used in `WHERE`/`ORDER BY`/`JOIN`** on hot tables (kudos, hearts, notifications). Postgres does NOT auto-index FKs.
- [ ] `EXPLAIN (ANALYZE, BUFFERS)` on hot queries → no `Seq Scan` on large tables.
- [ ] **RLS policies** — avoid per-row correlated subqueries; wrap `auth.uid()` so it's evaluated once; index columns the policy filters on.
- [ ] **Views** (`kudos_public_view`, `profile_stats_view`) — check the underlying plan; aggregate views (stats) may need a materialized view + refresh if slow.
- [ ] **RPC** (`open_secret_box`) — single round-trip, no N+1 inside.
- [ ] Realtime publication scoped (only `kudos` needs it); RLS on realtime tables not doing heavy work per event.
- [ ] Pagination on any unbounded list (kudos feed) — `limit`/`range`, keyset preferred over offset.

---

## 4. Measurement Flow

### Local (now)
1. **BE static:** `grep -i` migrations for indexes/FK/RLS; read view + RPC definitions.
2. **BE live:** local Supabase up (`supabase status`) → `psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres"` → `EXPLAIN (ANALYZE, BUFFERS)` on the queries the app's actions/hooks actually run.
3. **FE bundle:** `npm run build` → read the route/First-Load-JS table. Optionally add `@next/bundle-analyzer` for a treemap.
4. **FE runtime:** `npm run build && npm start` → Lighthouse via `automate-browser` (Puppeteer) or Playwright against `localhost:3001` for CWV.

### Production (after deploy)
5. **Real CWV:** Lighthouse against the `*.vercel.app` URL (throttled) — the honest numbers (free-tier TTFB, cold starts).
6. **BE prod:** Supabase Dashboard → **Reports / Query Performance** (pg_stat_statements) → slowest queries; add indexes via new migration.
7. **Vercel:** Speed Insights / function duration for Server Actions.

---

## 5. Audit Flow (when + how)

```
Trigger: before deploy · after a heavy feature · perf complaint · periodic
   │
   ├─ FE track ──▶ review-code (static: client boundary, bundle) ┐
   │              automate-browser (Lighthouse CWV)              ├─▶ report (plans/reports/perf-*)
   └─ BE track ──▶ review-code (static: index/RLS/view)          │      ranked findings + fixes
                  debug-code + EXPLAIN (live query plans) ───────┘
   │
   ▼
Fixes: index → new migration file (never edit shipped ones) · FE → lazy-load / move to Server Comp
   │
   ▼
Re-measure against §1 budgets → PASS = done. Optionally auto-research to drive one metric down.
```

**Rule:** a finding isn't "fixed" until re-measured against the §1 budget. No guessing — numbers decide.

## 6. Open Items
- Decide whether `profile_stats_view` should be materialized (depends on measured cost + refresh needs).
