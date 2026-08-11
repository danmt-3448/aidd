# Phase 07 — Integration + tests (unit + e2e)

**Track:** test · **Scope:** core · **blockedBy:** 01–04 (+05/06 nếu giữ)

## Precondition
UI 2 màn (Viết Kudo, Board) đã **PASS UI-First Gate** → được integrate + viết test ngay (không vi phạm UI-first). Phase này wire hook ↔ RPC mới + phủ test business-rule.

## Integration
- `use-toggle-heart.ts` ↔ `toggle_heart` RPC (phase-01) — optimistic khớp `{liked,heartCount}`.
- Board feed ↔ realtime + server-side count (phase-03).
- `use-create-kudo.ts` ↔ hardened `create_kudo` (phase-04) — surface P0007.
- Thay mọi mock data còn lại bằng real query (nếu còn `?ui_state` mock path ở board/kudos cho các field này).

## Tests (viết SAU gate)
**Unit (Vitest):**
- `toggle_heart` mapping trong heart-actions: like→liked=true+count; unlike→false; self-like→P0008 message; kudo-not-found→P0007.
- `friendlyRpcError`/`friendlyHeartError` map đủ P-codes.
- create_kudo action: receiver-not-found→P0007; orphan cleanup gọi `.remove` khi RPC fail.

**E2E (Playwright, project `authed`):**
- Like toggle: click → red + count+1; click lại → gray + count-1 (`7a7ec63e`).
- Double-click nhanh → không lỗi, resolve về 1 trạng thái (`91e102ba`).
- Self-like: nút disabled trên kudo của mình (`63645b03`).
- Realtime: (nếu khả thi trong harness) 2 session → like ở A hiện ở B.
- Viết Kudo: submit hợp lệ → kudo xuất hiện feed (`ca8f60b3`); receiver rỗng → chặn (`ID-7`); hashtag 0 → chặn (`ID-14`); >5 hashtag/ảnh → chặn (`ID-17/20`).

> **Turbopack headless:** interactive/e2e cần `next build && next start` (dev Turbopack không hydrate — xem `ui-gate-turbopack-headless-hydration`). Chạy e2e trên prod build.

## Steps
1. Wire hooks ↔ RPC mới; `npx tsc --noEmit`.
2. Viết unit (Vitest) cho action-level logic.
3. Viết e2e; chạy trên prod build (`npm run build && npm run start` + `npm run test:e2e`).
4. Fix tới khi xanh (max 3 vòng → escalate).

## Todo
- [ ] Integrate 3 hook ↔ RPC mới
- [ ] Unit tests (toggle/create mapping + cleanup)
- [ ] E2E business-rule (like/self-like/double-click/create validation)
- [ ] E2E chạy trên prod build, xanh

## Success Criteria
- Mọi business-rule test pass; 0 raw Postgres error; `tsc` + lint sạch.
- Reviewer (`/tkm:review-code`) + security (`/tkm:audit-security` cho auth/DB) pass.
