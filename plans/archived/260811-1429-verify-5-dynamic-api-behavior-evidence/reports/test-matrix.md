# Test Matrix — 5 dynamic screens (MoMorph High/critical TC ↔ existing E2E)

Source: MoMorph test_cases (main-thread fetch) · existing `e2e/*.spec.ts` (grep-informed coverage).
Status: **covered** (e2e already asserts) · **gap** (no test) · **stale** (test exists but predates fix / asserts old mock).
Precise per-TC mapping = Phase 04 (test-writer reads specs). This is the gap seed.

## board — MaZUn5xHXZ (41 TC) · e2e/board.spec.ts (15 tests, heart-heavy)
| Rule area | Key TC | Status |
|---|---|---|
| Like toggle + count (7a7ec63e) | heart toggle, count update | **covered** (21 heart refs) |
| Self-like block (63645b03) | disabled on own | covered |
| One-like-per-user (91e102ba) | multi-click blocked | covered |
| Special-day +2 to sender (31936b72) | weighted stat | **gap** (no weighted assertion in e2e) → Phase 03 runtime + Phase 04 unit |
| Hashtag filter (0e56cacb) / Dept filter (159fed13) | dropdown filters feed | **gap** (filter refs thin) |
| Empty feed "Hiện tại chưa có Kudos nào." (926d92a5) | empty state | covered (3 empty) |
| Spotlight states (d035e3b8) | loading/empty/interactive | gap |
| Copy-link toast (0adfd7ce) | clipboard + toast | gap |

## profile — 3FoIx6ALVb (30 TC) · e2e/profile.spec.ts (22 tests, sent/received)
| Rule area | Key TC | Status |
|---|---|---|
| Sent hidden on other (SEC_001, most important) | dropdown 1 option only | **covered** (sent/received heavy) |
| Route 404/malformed (FUN_003/004) | bad id → 404 | covered (error 7) |
| **V1 write-bar recipient pre-fill (FUN_007)** | modal opens pre-filled | **gap/stale** (just fixed; profile spec has 0 "pre-fill") |
| **V2 heart count → server value (FUN_014)** | toggle updates to server | **stale** (fixed; needs assert on profile feed) |
| **V3 sent-card receiver nav (GUI_006 parity)** | click receiver → profile | **gap** (just fixed) |
| Empty per-direction (FUN_012) | distinct sent/received copy | covered |
| Stats card 5 counters (GUI_004) | received/sent/hearts/boxes | partial |

## kudos / Viết Kudo — ihQ26W78P2 (57 TC) · e2e/viet-kudo.spec.ts (42 tests)
| Rule area | Key TC | Status |
|---|---|---|
| Recipient required + autocomplete (ID-7/8/25/26) | validation + search | **covered** (recipient 30) |
| Content required (ID-11) | empty → error | covered |
| Hashtag 1–5 required + max (ID-14/15/16/17) | min/max/error | **covered** (hashtag 25) |
| Image type/count (ID-18..24/55) | jpg/png only, ≤5 | partial |
| Anonymous toggle + alias field (ID-41..44) | show/hide name | covered (anonymous 7) |
| Rich-text bold/italic/link/quote/mention (ID-27..33) | tiptap format | gap (format refs thin) |
| Submit enable/disable + success (ID-46..49) | gate + close | covered |
| Double-submit guard (spec-verify L7) | rapid click → 1 kudo | **gap** → Phase 03 runtime |
| Sanitize XSS (server) | script strip | gap → unit |

## secret-box — J3-4YFIpMM (19 TC) · e2e/awards-rules-secret-box.spec.ts (12 tests, 3 secret-box)
| Rule area | Key TC | Status |
|---|---|---|
| Open → badge + count −1 (7c3c912f) | decrement | **gap** (thin) → Phase 03 runtime |
| Count=0 disabled (2a8a63de) | no-op at 0 | partial (seed user10=0 now) |
| Double-open no double-award | FOR UPDATE | **gap** → Phase 03 runtime |
| Weighted badge dist (d566fbeb) | 30/25/20/10/10/5 | SATISFIED static (spec-verify) |
| Close → /board | dismiss | gap |
| No ?ui_state override | gate-coverage gap | note |

## homepage — i87tDx10uM (62 TC) · e2e/homepage.spec.ts (45 tests)
| Rule area | Key TC | Status |
|---|---|---|
| Countdown D/H/M + TZ (ID-12/56/57) | ISO-8601 +07 compute | **covered** (countdown 3) |
| At-zero 00:00:00 + hide Coming-soon (ID-41/42) | zero state | covered |
| Invalid datetime fallback (ID-60) | no crash | gap |
| Bell badge gating + cap (ID-11/28/29) | show/hide | covered (badge 11) |
| Admin menu (ID-37/38) | role-based | covered |
| Language VN/EN (ID-25/26) | switch | covered |

## Priorities for Phase 04 (gap/stale to WRITE)
1. **profile V1/V2/V3** (just fixed, no/stale test) — highest.
2. **board** special-day weighting, hashtag/dept filter, spotlight states.
3. **secret-box** open decrement + double-open + close-nav.
4. **kudos** double-submit, image type/count, rich-text, sanitize.
5. **homepage** invalid-datetime fallback.
(Well-covered areas: skip re-writing; just confirm green in Phase 05.)
