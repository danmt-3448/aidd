---
title: Notification service + Realtime
work_type: feature
track: B
status: completed
blockedBy: [01]
blocks: [15]
spec_source: momorph:i87tDx10uM
---

# Phase 03 — Notification service + Realtime (Track B · logic)

## Context Links
- Recon: `plans/reports/check-progress-260803-1636-remaining-screens.md` (§6 Homepage — notif bell)
- Clarifications: full notification service in scope (table + unread badge + Supabase Realtime).
- DB: phase-01 `notifications` table.

## Overview
- **Priority:** P1 · **Status:** planned
- Full build (per clarification): server writes notifications on kudo-received; client reads unread
  count + list; Supabase Realtime pushes new rows to the Homepage bell badge live.

## Key Insights
- Notification creation is **server-side only** (RLS blocks client INSERT). Simplest correct source:
  a DB **trigger on `kudos` insert** that writes a "you received a kudo" row for `receiver_id`
  (SECURITY DEFINER). Keeps the write atomic with the kudo, no app-layer race.
- **Anonymous kudos: the trigger must NOT read the sender's name/profile AT ALL for anon rows** — it
  branches on `NEW.is_anonymous` BEFORE any sender lookup. Anon title is the EXACT string
  `"Bạn nhận được một Kudo ẩn danh"`. Non-anon title may include the sender's `full_name`.
- Realtime = `postgres_changes` on `notifications` filtered to `user_id = auth.uid()`.

## Requirements
### DB trigger (migration — owned here, not phase 01, to keep the trigger with its logic)
- `notify_on_kudo_insert()` DEFINER trigger AFTER INSERT ON `kudos`: insert a `notifications` row for
  `NEW.receiver_id`, `link = '/kudos'` (or board deep-link), `search_path=public`. Title branch:
  `if NEW.is_anonymous then 'Bạn nhận được một Kudo ẩn danh'` (no sender join) `else <sender full_name>-based title`.
  > **Migration ordering (HARD):** this trigger migration's timestamp MUST be strictly AFTER phase-01's
  > `notifications`-table migration — the trigger inserts into that table. Order it last among phase-01+03 DDL.

### Server actions (`src/features/notifications/notification-actions.ts`)
- `getUnreadCount()`: count `notifications where user_id=auth.uid() and not is_read`.
- `listNotifications({limit})`: recent notifications for caller, newest first.
- `markRead(id)` / `markAllRead()`: UPDATE own rows `is_read=true`.

### Client hook (`src/features/notifications/use-notifications.ts`)
- TanStack Query for unread count + list; subscribe to Realtime `postgres_changes` (INSERT on
  `notifications`, filter `user_id=eq.<uid>`) → invalidate/patch the count. Unsubscribe on unmount.

## Architecture — data flow
```
INSERT kudos ──trigger notify_on_kudo_insert──▶ notifications row (anon-safe title)
notifications ──Realtime postgres_changes(user_id=uid)──▶ use-notifications ──▶ bell badge (Homepage 11)
markRead/markAllRead ──▶ UPDATE is_read ──▶ badge decrements
```

## Related Code Files
- **Create:** `supabase/migrations/2026XXXX_notify_on_kudo_insert.sql`,
  `src/features/notifications/notification-actions.ts`, `src/features/notifications/use-notifications.ts`.
- **Modify:** none.
- **Delete:** none.

## Implementation Steps
1. Trigger migration: DEFINER function + AFTER INSERT trigger on `kudos`, anon-safe title.
2. Server actions: unread count, list, markRead, markAllRead (all caller-scoped).
3. Hook: query + Realtime subscribe/unsubscribe + cache patch on new row.
4. Confirm Realtime enabled for `notifications` (publication) in local config.

## Todo
- [ ] `notify_on_kudo_insert` DEFINER trigger (anon-safe title)
- [ ] `getUnreadCount` / `listNotifications`
- [ ] `markRead` / `markAllRead`
- [ ] `use-notifications` (query + Realtime + unsubscribe)
- [ ] Realtime publication includes `notifications`

## Success Criteria (binary)
- [ ] Inserting a kudo creates exactly one notification for the receiver.
- [ ] Anonymous kudo notification title is EXACTLY `"Bạn nhận được một Kudo ẩn danh"` (test asserts the exact string; no sender name).
- [ ] `getUnreadCount` reflects markRead within one query invalidation.
- [ ] A second client inserting a kudo pushes a Realtime event to the receiver's open session.
- [ ] User A cannot read/markRead user B's notifications (RLS).

## Risk Assessment
| Risk | Likelihood | Impact | Countermeasure |
|------|-----------|--------|----------------|
| Trigger leaks anon sender in title | Med | **High** | Anon-safe title CASE + explicit test |
| Realtime not enabled locally | Med | Med | Add table to publication; document in setup |
| Subscription leak | Med | Low | Unsubscribe on unmount; teardown test |

## Security Considerations
- Client cannot INSERT notifications (DEFINER trigger only); SELECT/UPDATE scoped to `auth.uid()`.

## Next Steps
- Homepage bell (11) consumes the hook in integration (15).

## MoMorph refs:
- Homepage SAA: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Clarifications: plans/260803-1636-saa2025-remaining-7-screens/clarifications.md
