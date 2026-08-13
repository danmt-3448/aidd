# Phase 01 — Viết Kudo modal UI (Track A)

**Track:** A (UI) · **Depends:** none · **Runtime skill:** `momorph-implement-design`

## MoMorph refs
- Viết Kudo: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- Clarifications: plans/260731-0836-viet-kudo/clarifications.md

## Goal
Code UI modal Viết Kudo pixel-perfect Figma + responsive (375/768/1280). Dùng nội dung Figma làm mock data, KHÔNG bịa. Chạy visual-diff loop tới khi khớp.

## Out of scope (Track A)
- Data thật / server actions / Supabase (Track B lo).
- Danh hiệu / Frame 552 (defer).
- Wiring image lên Storage, submit thật — chỉ presentational + local state.

## Integration contract (props Track B sẽ cấp ở phase 06)
- `recipients` search: `(q: string) => Promise<{id,name,avatar}[]>`
- `hashtags` catalog: `{id,name}[]`
- `onSubmit(payload)` + trạng thái `isSubmitting`, `errors`
- Editor phát HTML (`content_html`) gồm mention inline.
