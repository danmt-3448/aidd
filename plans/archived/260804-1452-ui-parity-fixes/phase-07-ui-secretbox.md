# Phase 07 — Secret-box UI (overlay, counter layout, close ×, subtitle)

**Track:** A · **Priority:** MAJOR · **Status:** pending · **blockedBy:** —

## MoMorph refs
- Open secret box: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/J3-4YFIpMM
- Clarifications: `plans/260803-1636-saa2025-remaining-7-screens/clarifications.md`

## Context
- Source report §2 + §3b (secret-box MAJOR). Gaps: missing subtitle "Click vào box để mở"; missing
  close × button; **counter layout reversed** (ref: big number + small label to its right; impl is
  reversed); card too narrow (~300 → should be ~420px); **wrong grey background → must be a dark
  full-bleed overlay, centered both axes**; @375 title clips first characters; gift-box image cropped.
- UI = Figma source of truth. Pull values from MoMorph `J3-4YFIpMM`.

## Requirements
- Functional: subtitle present; close × present + closes the modal; counter shows number-then-label
  (big number, small label right); card ~420px; dark full-bleed overlay centering content vertically
  AND horizontally; @375 title fully visible; gift-box image uncropped.
- Non-functional: components < 200 lines; counter value stays sourced from `unopened` (phase-03 owns
  the value; this phase owns only the **layout/markup** of the counter).

## Data flow
`useSecretBox` → `{ unopened, currentBadge, onOpen, onClose }` → `SecretBoxModal` /
`secret-box-connected` → overlay + card + counter layout. This phase reshapes presentation only.

## Related code files
- Modify: `src/features/secret-box/components/secret-box-modal.tsx` (overlay, card width, subtitle,
  ×, counter order, centering), `secret-box-connected.tsx` (wire close/overlay if needed).
- Import: `@/components/page-container` only if applicable (modal likely uses its own centered overlay).
- Do NOT change the counter **value/format logic** (phase-03) or `secret-box-actions.ts` (Track B).
- Update colocated tests `secret-box-modal.test.tsx` / `secret-box-connected.test.tsx` if selectors change.

## Implementation steps
1. Replace grey background with a dark full-bleed overlay (`fixed inset-0`) centering content on both axes.
2. Add subtitle "Click vào box để mở" and a close × button wired to `onClose`. In
   `secret-box-connected.tsx`, pass an `onClose` prop to `<SecretBoxModal>` (currently absent → the ×
   stays hidden because the modal renders × only when `onClose != null`); `onClose` dismisses the route.
3. Reverse counter layout to: large number then small label to the right (match ref order).
4. Widen card to ~420px per Figma (no fixed width that breaks <420px viewports — cap + responsive).
5. Fix @375: ensure title is fully visible (no left clip) and gift-box image is not cropped.
6. Visual-diff vs `J3-4YFIpMM` at 375/768/1280/1440 until parity.

## Todo
- [ ] Dark full-bleed overlay, centered both axes
- [ ] Subtitle + close × (× closes modal); `secret-box-connected` passes `onClose`
- [ ] Counter layout: number then label
- [ ] Card width ~420px, responsive
- [ ] @375 title + gift-box image intact
- [ ] Visual-diff parity @ 375/768/1280/1440

## Acceptance criteria (binary)
- [ ] Background is a dark full-bleed overlay (`fixed inset-0`), content centered vertically + horizontally.
- [ ] Subtitle "Click vào box để mở" is rendered.
- [ ] A close × button exists and dismisses the modal (asserted in `secret-box-modal.test.tsx`).
- [ ] `secret-box-connected` passes `onClose` to `SecretBoxModal`; × renders and dismisses the route.
- [ ] Counter renders the number before the label (number large, label small, to the right).
- [ ] Card width ≈ 420px at ≥768; does not overflow at 375.
- [ ] At 375 the title shows all characters and the gift-box image is not cropped.
- [ ] `tsc --noEmit` + `npm run build` succeed; colocated tests pass; components < 200 lines.

## Risk assessment
- **Med.** Full-bleed overlay may trap scroll / clash with existing modal mount; mitigation: reuse
  existing modal portal pattern, test Esc/backdrop close.
- Fixed 420px width breaking @375 → mitigation: `max-w-[420px] w-full` not fixed width.

## Security considerations
- None.

## Next steps
- Feeds phase-11 verify. Depends conceptually on phase-03 value but shares no files with it.
