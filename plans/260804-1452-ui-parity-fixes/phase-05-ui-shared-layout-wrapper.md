# Phase 05 — Shared max-width layout wrapper

**Track:** A · **Priority:** MAJOR · **Status:** pending · **blockedBy:** —

## Context
- Source report §3b "Phát hiện hệ thống @1440": most screens lack `max-width` + `mx-auto` on the
  content container → at 1440 content stretches, drifts left, dead whitespace. Affects login,
  countdown, rules, awards (and any full-width content screen).
- Design artboard is 1280 → beyond 1280 content must center in a capped column, not stretch.
- Fix once, reuse everywhere (DRY): a single `PageContainer` wrapper.

## File ownership (CRITICAL — parallel-safety)
- **This phase CREATES the wrapper only:** NEW `src/components/page-container.tsx`.
- It does **NOT** wire the wrapper into any screen — each screen's owning A-phase adopts it inside
  that phase's own files, so no two phases edit the same screen file.
  - awards → phase-06 uses its OWN existing 1440 cap (NOT PageContainer — single source of truth)
  - secret-box → phase-07 (own centered overlay) · kudos-modal cap is phase-08 (own max-width, see note)
  - login → phase-09 · countdown → phase-09 · rules → phase-09 (rules max-width cap folded into 09)
- Because only creation happens here, phase-05 shares no file with A-06..09 → fully parallel-safe.

## Requirements
- Functional: a reusable client-agnostic wrapper that caps content width and centers it, with an
  optional prop for the cap and horizontal padding, honoring Tailwind default breakpoints.
- Non-functional: ≤ 200 lines (trivially), no new deps, no layout regression at ≤1280 (must behave
  identically to today up to the artboard width).

## Data flow
`children` → `PageContainer` → `<div class="mx-auto w-full max-w-... px-...">` → screen content.
At >1280 the `max-w` caps and `mx-auto` centers; at ≤1280 it is full-width like today.

## Related code files
- Create: `src/components/page-container.tsx` — the wrapper + typed props.
- Read (for the correct cap value): MoMorph artboard width (1280) + existing container patterns in
  `src/features/homepage/components/homepage-screen.tsx`, `board-screen.tsx`.

## Implementation steps
1. Create `PageContainer` accepting `{ children, className?, maxWidth? }`; default cap = the artboard
   content width (derive from Figma, ~1280 content column) with `mx-auto` + responsive `px`.
2. Default the cap so that at ≤1280 rendering is visually unchanged from today (no regression).
3. Export it from `src/components/` (add to any barrel if one exists; otherwise direct import).
4. Do NOT modify any screen file here — adoption happens in phases 06–09.

## Todo
- [ ] Create `src/components/page-container.tsx` with typed props
- [ ] Verify at 1280 rendering matches pre-change (no regression) in isolation
- [ ] `tsc --noEmit` clean

## Acceptance criteria (binary)
- [ ] `src/components/page-container.tsx` exists, exports `PageContainer`, is < 200 lines.
- [ ] Component applies `mx-auto` + a `max-width` cap and accepts an override prop.
- [ ] No screen file is modified in this phase (git diff shows only the new file).
- [ ] `tsc --noEmit` and `npm run build` succeed.

## Risk assessment
- **Low.** Isolated new file. Risk: cap value wrong → downstream screens still drift; mitigation:
  derive cap from the 1280 artboard and validate visually in adopting phases (06–09) + verify (11).

## Security considerations
- None.

## Next steps
- Phase-09 screens (login, countdown, rules) import and apply `PageContainer` inside their own files.
  Awards (06) uses its own 1440 cap; secret-box (07) + kudos (08) use their own centered overlays.
