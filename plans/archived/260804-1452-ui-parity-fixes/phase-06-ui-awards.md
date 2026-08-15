# Phase 06 — Awards UI (2-column, badges, hero, sidebar nav)

**Track:** A · **Priority:** MAJOR · **Status:** pending · **blockedBy:** —

## MoMorph refs
- Hệ thống giải: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
- Clarifications: `plans/260803-1636-saa2025-remaining-7-screens/clarifications.md`

## Context
- Source report §2 + §3b (awards MAJOR). Gaps: card layout is 1-column → must be 2-column
  (badge left / text right, **alternating** per ref via existing `imageLeft` flag); **badge images
  don't load** (empty circles — wrong asset path / missing files); **missing hero artwork banner**;
  **missing sidebar nav anchor links**; @375 logo clip + prize text overflow; @1440 no centered container.
- UI = Figma source of truth. Do NOT guess visual values — pull from MoMorph `zFYDgyj_pD`.

## Badge asset contract (shared with phase-02)
- Phase-02 sets each `AWARDS[i].icon` to a distinct path under `/awards/`. **This phase owns the
  actual files in `public/awards/`.** Agree the 6 filenames with phase-02 before either starts so the
  `icon` string and the file on disk match. Export each badge from MoMorph `zFYDgyj_pD`.
- Filenames live in `plans/260804-1452-ui-parity-fixes/badge-asset-contract.md` (phase-02 writes it
  first); read it before exporting so the on-disk file matches the `icon` string.

## Max-width cap — single source of truth
- `awards-showcase.tsx` **already caps content at 1440px**. That existing cap is the SINGLE source of
  truth for this page. Do NOT ALSO wrap awards in `PageContainer`'s cap — stacking two caps is wrong.
  Keep/adjust the showcase's own 1440 cap for the @1440 centering fix; leave `PageContainer` for the
  phase-09 screens that lack any cap.

## Requirements
- Functional: 2-col alternating award rows; each badge image loads; hero artwork banner present;
  sidebar anchor nav linking to each award (`#{slug}`); content centered @1440 via the showcase's own
  1440 cap (single source of truth — NOT PageContainer); no clip/overflow @375.
- Non-functional: each component < 200 lines; no hardcoded width/height on >50%-viewport elements.

## Data flow
`AWARDS` (from phase-02) → `AwardsShowcase` (its own 1440 cap centers @>1280) → `AwardsNav` (sidebar
anchors) + per-award `AwardCard` (badge `icon` + prize/quantity/description).

## Related code files
- Modify: `src/features/awards/components/awards-showcase.tsx` (2-col grid, hero, keep its own 1440 cap),
  `award-card.tsx` (icon source fix, 2-col row already exists), `awards-nav.tsx` + `award-nav-item.tsx`
  (sidebar anchor links), `src/app/awards/page.tsx` if hero/layout wiring needed.
- Create: `public/awards/**` badge + hero assets (exported from Figma).
- Do NOT wrap awards in `@/components/page-container` — the showcase's own 1440 cap is the single cap.
- Do NOT edit `award-config.ts` here (phase-02 owns data/`icon` strings).

## Implementation steps
1. Export badge + hero artwork assets from MoMorph `zFYDgyj_pD` into `public/awards/`.
2. In `award-card.tsx` wire the correct `AWARDS[i].icon` into the badge `<Image>` source — it currently
   hardcodes an overlay, so the empty-circle bug is a **source fix, not a layout rebuild**. The 2-col
   alternating layout (`imageLeft`) already exists; keep it, just point the image at the phase-02 `icon`.
3. Add hero artwork banner at the top of `awards-showcase.tsx`.
4. Build sidebar anchor nav (`awards-nav.tsx`) linking `#{slug}` to each award section.
5. Fix @1440 stretch via the showcase's existing 1440 cap (center it); do NOT add PageContainer.
6. Fix @375: prevent logo clip and prize-text overflow (wrap/scale, no fixed widths).
7. Visual-diff vs `zFYDgyj_pD` at 375/768/1280/1440 until parity.

## Todo
- [ ] Export + place badge/hero assets in `public/awards/`
- [ ] 2-col alternating `AwardCard`; badges load
- [ ] Hero artwork banner
- [ ] Sidebar anchor nav
- [ ] @1440 centered via showcase's own 1440 cap (no PageContainer)
- [ ] Fix @375 clip/overflow
- [ ] Visual-diff parity @ 375/768/1280/1440

## Acceptance criteria (binary)
- [ ] Award rows render 2 columns (badge one side, text the other), alternating per `imageLeft`.
- [ ] All 6 badge images load (no empty circle / broken img) at 1280.
- [ ] A hero artwork banner is present at the top of `/awards`.
- [ ] A sidebar nav lists all 6 awards; clicking an item scrolls to that award (`#{slug}`).
- [ ] At 1440 the content is centered (max-width capped), not left-stretched.
- [ ] At 375 the logo is not clipped and no prize text overflows its container.
- [ ] `tsc --noEmit` + `npm run build` succeed; each edited component < 200 lines.

## Risk assessment
- **Med.** Badge filename mismatch with phase-02 → broken images; mitigation: shared asset contract.
- Alternating layout regressions @375 → mitigation: stack to 1-col on mobile per Figma mobile behavior.

## Security considerations
- None (static assets).

## Next steps
- Feeds phase-11 verify.
