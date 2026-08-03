---
reviewer: plan-reviewer (completeness lens)
date: 2026-08-03
plan: plans/260803-1636-saa2025-remaining-7-screens/plan.md
scope: LENS 1 — completeness, spec/test coverage, i18n, auth, error/edge states
verdict: APPROVED_WITH_CONDITIONS
---

# Plan Review — Completeness (Lens 1)

## Scope
- 17 phase files read in full
- Recon (`check-progress-260803-1636-remaining-screens.md`) cross-referenced per screen
- Clarifications file confirmed authoritative
- 193 MoMorph test cases total (7 screens) — not row-by-row verified; coverage judged from phase-16 matrix and phase-file requirements
- No spot-check MCP call needed; recon is sufficient for this pass

---

## Critical

**C1 — Phase 16 spec_source references only ONE screen (Homepage), not all 7**
`phase-16-tests.md` frontmatter has `spec_source: momorph:i87tDx10uM` (Homepage). The test phase is the TDD anchor for all 193 cases across 7 screens; it must reference all 7 screenIds so the tester agent can pull test cases at runtime. If the tester inherits this file and fetches only Homepage test cases, 131 of 193 cases go uncovered.
**Fix:** Add all 7 screenIds to `spec_source` in phase-16 frontmatter, matching the test-matrix table already present in the body.

**C2 — Phase 15 `blockedBy` omits phase 01 (DB foundation)**
Integration phase (`blockedBy: [02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14]`) is missing `01`. Phase 01 must complete before any of 02–06 can be confirmed, and the anon-mask view `kudos_public` must exist before integration wires board/profile feeds. This is a silent race: phase 15 can be triggered before the DB migrations are verified.
**Fix:** Add `01` to `blockedBy` in `phase-15-integration.md`, or add a note that phase 01 is implicitly covered via 02–06 but document the transitivity explicitly so the executor does not skip it.
**Note:** This is primarily a graph correctness issue in the plan representation; if the executor always runs 01 first because 02–06 depend on it, the practical risk is low. Still, the omission is a silent gap that can catch out automated plan runners.

---

## Warning

**W1 — Auth-gating coverage gap: Countdown and Rules not explicitly auth-guarded in plan**
Recon §3 (Countdown): "nav locked until 00:00:00" is covered. But the recon also notes the page is "behind the route guard" (phase-02 calls it "auth-guarded via route"). Phase 08 (UI) and phase 02 (logic) both mark auth-guard as integration concern, but phase 15's requirements block for Countdown (`Countdown (08←02): use-countdown → LED display; enforce nav-lock until done; invalid fallback`) does not mention the route-level auth guard — only the countdown nav-lock. If the integration engineer reads phase 15 literally, the auth guard could be omitted.
Recon §5 (Rules): No auth guard mentioned in recon or any Rules phase. Prize (§4) recon states "auth check → redirect login. No CRUD." Prize has no auth-gate requirement in phase 07 or phase 09; phase 15 does not mention a redirect for Prize.
**Fix:** Phase 15 requirements block for Countdown should add "route auth guard (unauthenticated → /login)"; Prize should add the same. Rules modal: confirm whether it requires auth; if the Rules modal is accessible without login, document that explicitly rather than leaving it ambiguous.

**W2 — Homepage: admin-role gating has no backend query specified**
Recon §6: "auth-gated account menu + role (admin)". Phase 03, 04, 05, 07 are backend phases; none creates an `isAdmin` query or a role-checking server action. Phase 11 (UI) names `isAdmin` in the integration contract, and phase 15 mentions "auth-gated account menu + admin". But no phase owns the server-side resolution of `isAdmin` — which table/column/field delivers this value is unspecified. The `profiles` table presumably has a `role` column, but no phase creates a `getIsAdmin()` action or documents where this comes from.
**Fix:** Phase 05 (profile queries, Track B) or a brief addition to phase 07 should define `getIsAdmin()` (or confirm it comes from the existing `profiles.role` field already readable by the auth guard layer) and name the file that owns it.

**W3 — Live board: dept/hashtag filter state sync (carousel ↔ feed) has no explicit owner**
Recon §8: "Filters hashtag/dept; filter state sync carousel↔feed." Phase 04 names `listBoardKudos({ hashtagId?, departmentId? })` and the hook `use-board-feed` with "filter params sync carousel↔feed." Phase 12 (UI) defers filter-sync to integration. Phase 15 integration block says "filter sync carousel↔feed" in one line. However, no phase defines the filter state container (Zustand slice, URL param, or React state) or the source of `departmentId` data (a `departments` table query, a static enum, or something else). With 64 specs on this screen, filter bugs are high-probability.
**Fix:** Phase 04 or phase 15 should name the filter state mechanism and the department list source (query vs static config).

**W4 — E2E session injection unresolved — plan flags it as risk but does not resolve it**
Phase 16 explicitly notes: "E2E session injection unresolved (Viết-Kudo gap) — Likelihood Med, Impact High." The plan acknowledges this but offers only "resolve service-role session inject first; blocks e2e sign-off" without a concrete resolution path. If this is unresolved at test time, all 7 E2E flows stall.
**Fix:** Add a concrete implementation step to phase 16: document the `supabase/seed-auth-users.mjs` path (already noted in CLAUDE.md) as the resolution, or add an explicit task to the phase-16 todo list so the tester does not encounter a blank wall.

---

## Suggestion

**S1 — Secret box: "loading / pending" state after click not mentioned anywhere**
Recon §7 has 19 test cases for a 4-spec screen — a higher test-to-spec ratio suggesting edge-case density. The UI (phase 14) and hook (phase 06) cover disable-at-zero and open flow. Neither explicitly mentions the pending/loading state between click and RPC response. With a DEFINER RPC, there is latency. A missing loading guard could trigger double-click opens before the disable propagates.
Phase 06 success criteria covers the row-lock for concurrent opens, but the UI-layer loading state (button disabled while mutation in flight) is not in any todo or success criterion.
**Recommendation:** Add to phase-14 integration contract: `isOpening: boolean` prop; add to phase-06 hook todo: "disable button while mutation pending."

**S2 — Responsive breakpoints: stated in plan.md DoD but not echoed in per-screen Track A phases**
Plan DoD: "responsive (375/768/1280)". CLAUDE.md requires all screens to be tested at these three sizes. The Track A phases (08–14) are minimal by design (≤30 lines), but none mentions responsive testing or breakpoints in even one line. The `momorph-implement-design` skill handles this at runtime per its own loop, which may be sufficient — but a passing note in phase 15 integration success criteria ("responsive verified at 375/768/1280 for all 7 screens") would make it an explicit check rather than an implicit assumption.

**S3 — i18n (VN/EN) coverage: only phase 07 owns i18n keys; no explicit i18n task for Countdown / Secret box / Profile / Live board**
Phase 07 owns i18n for Prize + Rules. Phase 02, 04, 05, 06 do not mention i18n. The recon notes i18n labels for Countdown; Live board and Profile have VN text in their specs. Phase 15 integration does not mention an i18n wiring step for these screens. This is unlikely to be a blocker (next-intl is already set up), but the plan has a gap between "Track A builds with mock VN text from Figma" and "Track B defines no i18n keys for countdown/board/profile/secretbox." Integration could ship with hardcoded VN strings if this gap is not noticed.
**Recommendation:** Phase 15 should include a one-line i18n audit step: confirm all user-visible strings for the 5 remaining screens (Countdown, Homepage, Live board, Profile, Secret box) have i18n keys and are not hardcoded from Figma mock text.

---

## Screen-by-Screen Coverage Table

| Screen | Recon requirements | Plan home | Error/empty/loading states | i18n explicit | Auth gating | Verdict |
|--------|-------------------|-----------|---------------------------|---------------|-------------|---------|
| Countdown | datetime source, per-sec tick, nav-lock, invalid fallback, responsive | 02 (logic) + 08 (UI) + 15 | invalid fallback explicit (02); loading implicit | Track A mock; no explicit i18n phase | Route guard in 02 (implicit); not in 15 (W1) | Covered with W1 |
| Prize | 6 award defs, smooth-scroll, active-menu, auth→redirect | 07 (content) + 09 (UI) + 15 | static; no error states needed | 07 owns i18n keys | Auth redirect present in recon; missing in plan (W1) | Covered with W1 |
| Rules | scrollable text, 6 badges, "Đóng"/"Viết KUDOS", scroll-overflow | 07 (content) + 10 (UI) + 15 | scroll-overflow→button-enable in 15 | 07 owns i18n keys | Not specified, possibly not required; ambiguous (W1) | Covered with W1 |
| Homepage | sticky header, countdown, notif bell, lang switch, account/admin menu, award grid, Kudos promo, footer; responsive 3→2→1 | 02+03+07 (logic) + 11 (UI) + 15 | invalid countdown fallback; notif empty state implicit | Track A mock; no explicit phase for non-07 i18n (S3) | Auth-gated account menu in 15; admin role source missing (W2) | Covered with W2 |
| Secret box | entitlement, weighted-random server-side, decrement, validate server-side, badge URL sanitize | 06 (logic) + 14 (UI) + 15 | disable-at-zero + error messages in 06 | Track A mock; no explicit phase (S3) | Implicit (auth guard reused) | Covered with S1 |
| Live board | KV banner, write-kudo input, highlight carousel, infinite feed, spotlight word-cloud, sidebar stats/leaderboards, hearts, copy-link, filters, realtime | 04 (logic) + 12 (UI) + 15 | optimistic rollback on heart error (04); loading/empty on feed implicit | Track A mock; no explicit phase (S3) | Auth guard reused; not re-stated | Covered with W3 |
| Profile | SELF/OTHER dual-mode, stats card, direction feed, UUID guard, write-bar prefill, anon mask, tier/stars gating, badge slots | 05 (logic) + 13 (UI) + 15 | UUID 404, sparse-profile null-checks (05) | Track A mock; no explicit phase (S3) | Auth guard reused; not re-stated | Covered |

---

## Phase 16 Test Coverage Assessment

Phase 16 explicitly references all 193 test cases and maps them to a four-layer matrix (unit logic, unit security, DB-integration, E2E per screen). The coverage design is sound and comprehensive for the backend invariants. The E2E coverage per screen names primary flows drawn from the MoMorph test cases.

**Gap:** The `spec_source` frontmatter (C1) means automated tooling that uses that field to fetch test cases will only pull Homepage cases. The body of the phase is correct; only the metadata is wrong.

**Gap:** No explicit mention of testing the Prize auth-redirect flow or Rules auth state — consistent with the W1 ambiguity about whether those screens require auth.

---

## Verdict

**APPROVED_WITH_CONDITIONS**

The plan is structurally sound, the two-track parallel shape is correct, all 7 screens have both a UI phase and a backend-logic phase, the integration phase contracts are pre-agreed, the critical sender-masking precondition is explicit and load-bearing, and the test phase covers the full 193-case scope in its body.

Two conditions must be resolved before execution:

1. **C1 (MUST fix before phase-16 execution):** Add all 7 screenIds to `phase-16-tests.md` `spec_source` frontmatter.
2. **C2 (MUST fix before phase-15 execution, or document transitivity):** Add `01` to `phase-15-integration.md` `blockedBy`, or annotate the transitivity.

Warnings W1–W4 should be resolved during integration (phase 15) author review; they are not ship blockers in isolation but are high-probability points of confusion. Suggestions S1–S3 are deferred.

All critical security invariants (anon-mask, sent-hidden, server-authoritative box, PII guard) are covered in phases 01/04/05/06 with explicit success criteria and re-verified in phase 17. The plan does not approve itself on security gaps.
