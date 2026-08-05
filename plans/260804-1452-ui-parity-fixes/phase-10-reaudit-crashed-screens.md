# Phase 10 — Re-audit + fix the 3 previously-crashing screens

**Track:** A · **Priority:** MAJOR · **Status:** pending · **blockedBy:** phase-01

## MoMorph refs
- Homepage SAA: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Profile bản thân: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/3FoIx6ALVb
- Clarifications: `plans/260803-1636-saa2025-remaining-7-screens/clarifications.md`

## Context
- Source report §3: homepage / board / profile crashed at every breakpoint (dicebear next/image),
  so no parity diff exists yet. **phase-01 removes the crash.** Only after that can these 3 screens be
  captured and audited. This phase = capture → diff → fix whatever the diff reveals.
- **blockedBy phase-01** — the ONLY cross-track dependency in this plan (real, not artificial).

## Requirements
- Functional: homepage/board/profile render without crash and meet desktop parity @1280 + responsive
  @375/768/1440 vs their MoMorph refs.
- Non-functional: diffs found are fixed in the owning feature's own files; components < 200 lines.

## Data flow
phase-01 fix → screens render → capture via `e2e/audit-capture.mjs` → compare to
`plans/reports/ui-audit/momorph/` → enumerate diffs → fix in `src/features/{homepage,board,profile}/**`.

## Related code files
- Read: `e2e/audit-capture.mjs` (capture harness), `plans/reports/ui-audit/momorph/` (refs).
- Modify (only what the diff requires): `src/features/homepage/components/**`,
  `src/features/board/components/**`, `src/features/profile/components/**`.
- May import `@/components/page-container` (phase-05) if these screens also stretch @1440.
- Owns NONE of phases 06–09 files → parallel-safe with them once phase-01 is done.

## Implementation steps
1. Confirm phase-01 merged (screens no longer crash); run `npm run dev` + load all 3.
2. Capture homepage/board/profile at 375/768/1280/1440 via `e2e/audit-capture.mjs`.
3. Diff each against `plans/reports/ui-audit/momorph/` refs; write a short diff list per screen.
4. Fix each diff in the owning feature's components (apply `PageContainer` if @1440 stretch appears).
5. Re-capture + re-diff until parity.

## Todo
- [ ] Verify no crash on `/`, `/board`, `/profile` (post phase-01)
- [ ] Capture 3 screens @ 375/768/1280/1440
- [ ] Enumerate diffs per screen vs refs
- [ ] Fix diffs in owning feature files
- [ ] Re-capture → parity

## Acceptance criteria (binary)
- [ ] `/`, `/board`, `/profile` load with zero runtime/console errors at 375/768/1280/1440.
- [ ] Each screen visually matches its MoMorph ref at 1280 (desktop parity).
- [ ] No layout break (overflow/clip/left-stretch) at 375/768/1440 on any of the 3 screens.
- [ ] A per-screen diff list was produced and every listed diff is resolved.
- [ ] `tsc --noEmit` + `npm run build` succeed; edited components < 200 lines.

## Risk assessment
- **Med.** Unknown diffs until capture → effort uncertain; mitigation: this phase is intentionally
  capture-first so scope is discovered before fixing. If diffs are MAJOR, split into follow-up phases.
- Hard dependency on phase-01 → cannot start until dicebear fix lands.

## Security considerations
- None beyond phase-01's added image host.

## Next steps
- Feeds phase-11 verify.
