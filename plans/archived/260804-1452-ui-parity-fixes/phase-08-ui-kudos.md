# Phase 08 — Kudos compose modal (Danh hiệu field, max-width cap, overlay)

**Track:** A · **Priority:** MAJOR · **Status:** pending · **blockedBy:** — (UI renders parallel; only the wire-into-submit step is `blockedBy` phase-12)

## MoMorph refs
- Viết Kudo: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- Clarifications: `plans/260803-1636-saa2025-remaining-7-screens/clarifications.md`

## Context
- Source report §2 + §3b (kudos MAJOR). Gaps: **missing required field "Danh hiệu *"** (sits between
  "Người nhận" and the rich-text editor, has helper text); modal background is cream/yellow → must be
  white; backdrop is solid black → must be a dim overlay; label layout is vertical → should be inline
  per ref; **modal has no max-width cap** → stretches to ~720px @1440; **bottom clipped → Hủy/Gửi
  buttons lost** (needs vertical centering / internal scroll); @375 toolbar clips.
- 0/2000 counter: KEEP per clarifications.md 2026-08-04. No action / no sign-off needed.
- Spec authority: "Danh hiệu" is required per MoMorph spec. UI = Figma source of truth.
- Persistence: `danh_hieu` DB column + RPC handled by **phase-12** (Track B). The Danh-hiệu UI field
  renders here in parallel, but the **wire-into-submit step is `blockedBy` phase-12**.

## Requirements
- Functional: "Danh hiệu *" required field present between recipient and editor, with helper text and
  validation; modal bg white; dim overlay backdrop; inline labels; modal max-width capped; entire
  modal (incl. Hủy/Gửi) reachable at all breakpoints (center vertically + internal scroll if tall);
  @375 toolbar not clipped.
- Non-functional: components < 200 lines; "Danh hiệu" wired into submit payload + schema validation.

## Data flow
`KudoComposeModal` → new "Danh hiệu" field → local form state → `kudo-schema` validation →
`use-create-kudo` submit payload. Presentation: overlay + capped modal + submit-bar always visible.

## Related code files
- Modify: `src/features/kudos/components/kudo-compose-modal.tsx` (add Danh hiệu field, white bg, dim
  overlay, max-width cap, vertical center/scroll, inline labels), `submit-bar.tsx` (ensure always
  visible), `rich-text-toolbar.tsx` (@375 no clip).
- Modify: `src/features/kudos/kudo-schema.ts` (add `danhHieu` required) + `kudo-schema.test.ts`.
- Import: `@/components/page-container` NOT used for modal — modal uses its own capped centered box.
- Wire-into-submit (`kudo-actions.ts` / `hooks/use-create-kudo.ts` carrying `danh_hieu`) is owned by
  phase-12 and gated on it — do NOT wire submit persistence here until phase-12 lands.

## Implementation steps
1. Add "Danh hiệu *" required field (with helper text) between "Người nhận" and the editor.
2. Add validation to `kudo-schema.ts` (required, non-empty) + update `kudo-schema.test.ts`.
3. Wire the field into the submit payload (`use-create-kudo` / `kudo-actions`) ONLY after phase-12
   lands the `danh_hieu` column + RPC param. Until then the field renders + validates locally but is
   not persisted. This step is `blockedBy` phase-12.
4. Change modal background to white; backdrop to a dim overlay (not solid black).
5. Cap modal max-width (e.g. per Figma ~640px); center vertically; add internal scroll so Hủy/Gửi
   stay visible at every viewport (fixes @1440 stretch + bottom clip).
6. Switch labels to inline per ref; fix @375 toolbar clip (wrap/scroll toolbar).
7. 0/2000 counter: KEEP per clarifications.md 2026-08-04. No action / no sign-off needed.
8. Visual-diff vs `ihQ26W78P2` at 375/768/1280/1440 until parity.

## Todo
- [ ] Add required "Danh hiệu *" field + helper text (correct position)
- [ ] Schema validation + test for Danh hiệu
- [ ] Wire into submit payload (blockedBy phase-12; not before column+RPC land)
- [ ] White modal bg + dim overlay backdrop
- [ ] Max-width cap + vertical center/scroll (Hủy/Gửi always visible)
- [ ] Inline labels; @375 toolbar not clipped
- [ ] 0/2000 counter KEPT (per clarifications — no action)
- [ ] Visual-diff parity @ 375/768/1280/1440

## Acceptance criteria (binary)
- [ ] A required "Danh hiệu *" field renders between "Người nhận" and the editor, with helper text.
- [ ] Submitting with empty "Danh hiệu" is blocked by validation (asserted in `kudo-schema.test.ts`).
- [ ] Modal background is white; backdrop is a semi-transparent dim overlay (not solid black).
- [ ] At 1440 the modal width is capped (does not stretch to ~720px).
- [ ] Hủy and Gửi buttons are visible/reachable at 375/768/1280/1440 (no bottom clip).
- [ ] At 375 the rich-text toolbar is not clipped.
- [ ] Danh hiệu value round-trips: submit → stored in `kudos.danh_hieu` → read back; verified by a
      test. Field is NOT wired to submit until phase-12 lands (wire-step `blockedBy` phase-12).
- [ ] `tsc --noEmit` + `npm run build` + `npm run test -- kudo-schema` succeed; components < 200 lines.

## Risk assessment
- **Med.** UI-only work here; persistence risk is owned by phase-12. Mitigation: the wire-into-submit
  step is `blockedBy` phase-12 so no faked persistence can land — the field renders + validates
  locally until the column/RPC exist.

## Security considerations
- New field is user input → validate/sanitize like other kudo text; no raw HTML injection via helper.

## Next steps
- Wire-into-submit step consumes phase-12 (`danh_hieu` column + RPC param).
- Feeds phase-11 verify.
