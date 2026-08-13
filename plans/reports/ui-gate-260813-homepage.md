# UI-First Gate — homepage (/) — PASS

Context: i18n crash fix — `getTranslations` (server-only) → `useTranslations` (isomorphic)
in the homepage subtree rendered under the `'use client'` `homepage-screen.tsx`. Change is
i18n-mechanism-only (no color/spacing/size/font/className/style/structure changed).

## A. Property-diff (CỔNG CỨNG) — 1440 + 1280
- **`style-assert` verdict: PASS** at both viewports via push-button harness
  `node .claude/skills/aidd-ui-gate/scripts/regate.mjs` → `homepage  PASS  1440=PASS 1280=PASS ovf=ok/ok/ok`.
- Nodemap: `plans/reports/_gate-ref/nodemap/homepage.map.json` / `homepage.map.1280.json` (design side authoritative from MoMorph `get_node`).
- Nets: no horizontal overflow at 1440/1280/1920 (ovf=ok/ok/ok). Homepage is a public route (`/`) so the harness's unauth capture is the correct render state.
- Port verified: 127.0.0.1:3001 · color-profile=srgb · font.ready=true.

## B. Behavior (real data, authed session) — 100%
- [x] Route `/` renders (HTTP 200), title "Sun* Annual Awards 2025".
- [x] **0 console errors** (Playwright) — the original `getTranslations is not supported in Client Components` unhandledRejection is gone.
- [x] Hero (coming-soon, countdown, CTAs), Root-Further card, awards grid, footer all render their i18n text.
- [x] Navigation CTAs (/awards, /board) unchanged — i18n import swap does not alter behavior.
- Note: change is behavior-neutral for visuals; the only functional effect is fixing the crash.

## Verdict: PASS
