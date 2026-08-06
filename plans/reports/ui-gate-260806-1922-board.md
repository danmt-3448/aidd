# UI-First Gate — board — PASS

**Screen:** `/board` (Sun* Kudos Live board) · screenId `MaZUn5xHXZ` · fileKey `9ypp4enmFmdK3YAFJLIu6C`
**Date:** 2026-08-06 19:22 · Port 127.0.0.1:3001 · color-profile srgb · font.ready true
**Note:** re-issued after orchestrator fixed the 1280 spotlight overflow (responsive width) that the prior board run left open. Supersedes `ui-gate-260806-1740-board.md`.

## A. Property-diff (CỔNG CỨNG) — 1440 + 1280

`style-assert` @1440: exit 0 · elements=11 · checks=14 · failed=0
`style-assert` @1280: exit 0 · elements=11 · checks=14 · failed=0

Section heights (kind:section, ±2px) — all sourced from live `get_node(MaZUn5xHXZ)`:

| key | nodeId | code | design | verdict |
|---|---|---|---|---|
| kv-banner-height | 2940:13432 | 512 | 512 | PASS |
| highlight-height | 2940:13461 | 525 | 525 | PASS |
| spotlight-height | 2940:14174 | 548 | 548 | PASS |
| all-kudos-list-height | 2940:13482 | 3068 | 3068 | PASS |
| feed-card bg/radius/padding | 3127:21871 | #FFF8E1 / 24px / 40px | (get_node) | PASS |
| spotlight border/radius | 2940:14174 | 1px rgb(153,140,95) / 47.14px | (get_node) | PASS |

Spotlight width now responsive (`width:100%; maxWidth:1157`) — exact-width check dropped intentionally (no fixed width > 50% viewport); height/border/radius remain the fidelity signals.

### Nets
- overflow @1440: scrollWidth = clientWidth → no horizontal overflow — PASS
- overflow @1280: scrollWidth 1265 = clientWidth 1265 (was 1301>1265 before fix) → no horizontal overflow — PASS
- density: all-kudos list = 4 feed cards matching Figma `2940:13482` (3068px) — PASS

## B. Behavior (mock data)
- [x] 4 states `?ui_state=full|empty|error|loading` render (SSR) with 0 app console errors (dev HMR WebSocket noise excluded)
- [x] no horizontal overflow at 1440 or 1280 across states
- [x] spotlight is a scatter cloud (not flow rows); 0 duplicate-key errors
- [ ] interactive (carousel/hashtag-filter clicks) — HELD: Turbopack-headless does not hydrate; verify on `next build && next start` (see summary report)

## Verdict: PASS
