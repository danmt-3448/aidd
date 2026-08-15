# UI-Gate: Feed Order + Recipient Dropdown — 2026-08-13

**Reviewer:** code-reviewer agent  
**Prod server:** `localhost:3001` (prod build, `NODE_ENV=production`)  
**Auth:** `e2e/.auth/user.json` (Trần Thị Bình, regular user)  
**Screens touched:** `/board` (spotlight activity feed) · compose modal (recipient dropdown)

---

## FIX 1 — Activity feed: newest at bottom

### Verdict: PASS

**Behavior observed (DOM, 6 rows, top→bottom):**

| DOM index | Time displayed | Opacity | DB created_at (UTC) |
|-----------|---------------|---------|---------------------|
| 0 (top)   | 01:02PM       | 0.18    | 2026-08-12 06:02:01 |
| 1         | 01:10PM       | 0.28    | 2026-08-12 06:10:36 |
| 2         | 01:10PM       | 0.40    | 2026-08-12 06:10:37 |
| 3         | 01:44PM       | 0.55    | 2026-08-12 06:44:01 |
| 4         | 01:44PM       | 0.75    | 2026-08-12 06:44:01 |
| 5 (bottom)| **07:31AM**   | **1.00**| **2026-08-13 00:31:44** |

- Bottom row (index 5) = `07:31AM` = the NEWEST kudo (today 2026-08-13, created_at DESC first in RPC). Opacity = 1.0. CORRECT.
- Top row (index 0) = `01:02PM` = oldest visible = least opaque (0.18). CORRECT.
- Opacity ramp ascends monotonically top→bottom: `0.18 → 0.28 → 0.40 → 0.55 → 0.75 → 1.00`. CORRECT.
- Note: the bottom row showing `07:31AM` appears "earlier" than the `01:44PM` rows above it. This is intentional — it is from a different day (2026-08-13) while the PM entries are from 2026-08-12. DB `ORDER BY created_at DESC` is authoritative; time display is local (Asia/Ho_Chi_Minh) HH:MM AM/PM without date prefix. Confirmed by DB query.

**Console errors on /board:** 0.

**Screenshots:**
- `evidence/screenshots/feed-order-1440.png` — spotlight section @1440
- `evidence/screenshots/feed-order-1280.png` — spotlight section @1280

### Style-assert regression check (live DOM capture)

| Viewport | Map | Elements | Checks | Failed | Exit |
|----------|-----|----------|--------|--------|------|
| 1440px | `board-spotlight.map.json` | 6 | 13 | 0 | **0 (PASS)** |
| 1280px | `board-spotlight.map.1280.json` | 6 | 13 | 0 | **0 (PASS)** |

Fresh `getComputedStyle` captured from live DOM, asserted against design values. Feed reorder did not break any tagged spotlight element.

---

## FIX 2 — Compose modal recipient dropdown: ~20 default suggestions

### Verdict: PASS

**Path to modal:** `/board` → click "Viết lời cảm ơn và ghi nhận" → compose modal → click "Tìm kiếm" pill (recipient trigger).  
(Note: `/kudos` redirects to `/board` in prod; modal opened from board's compose trigger.)

**Default suggestions on open (no typing):**

Count of `[role="option"]`: **20 items** loaded immediately on dropdown open.

Sample list (alphabetical, server returns first 20 by `full_name ASC`):
```
An Thị Xuân, Bình Văn Yên, Bùi Thị Hương, Cường Thị Chi, Đặng Văn Giang,
Đinh Văn Iên, Dũng Văn Đạt, Em Thị Diệu, Giang Văn Đông, Hoàng Văn Em,
Hương Thị Giáo, Iên Văn Hà, Lê Văn Cường, Lý Văn Long, Mai Thanh Dan,
Mai Thị Mai, Ngô Thị Khánh, Nguyễn Thị Nga, Nguyễn Văn An, Phạm Thị Dung
```

- Empty placeholder "Nhập tên để tìm kiếm": **NOT shown**. CORRECT.
- "Đang tìm kiếm" loading state: **NOT shown** (results came immediately from cache/fast RPC). CORRECT.
- Current user (Trần Thị Bình) is **excluded** from the list. CORRECT (server action filters `neq id`).

**Filter-on-type:**

Typed "Tr" via `page.keyboard.type()` (React keyboard event) + 1200ms debounce wait:
- Option count: **1** (down from 20). CORRECT — filtering works.
- Matching result: **"Trịnh Văn Sơn"** (ILIKE `%Tr%`, limit 10).
- Note: only 1 Vietnamese name containing "Tr" in the seed — expected given seed size.

**Console errors on compose modal:** 0.

**Screenshots:**
- `evidence/screenshots/compose-modal-open.png` — modal opened
- `evidence/screenshots/recipient-dropdown-compose.png` — dropdown open, 20 options visible
- `evidence/screenshots/recipient-filter-typed.png` — after typing "Tr", 1 filtered result

---

## Notes

### Caveat: time ordering UI ambiguity
The activity feed shows time only (no date). With seed data spanning 2 days, the bottom row (`07:31AM`) appears to come "before" the `01:44PM` rows above it in wall-clock reading. This is not a bug — the feed is ordered by `created_at DESC` (newest first from DB, then reversed for display). A user who doesn't know the date context might be confused. Low priority: adding a relative timestamp (e.g. "vừa xong", "Hôm qua 01:44PM") would make ordering more legible.

### style-assert map limitation
The existing `board-spotlight.map.json` does not include entries for the activity feed rows (`data-fig="activity-feed-row"`) — those use code-derived slugs, not real Figma nodeIds. The style-assert passed on the 6 existing tagged elements. Feed row opacity values (from `ROW_OPACITY = [1, 0.75, 0.55, 0.4, 0.28, 0.18]`) are unverified by style-assert but confirmed visually via computed opacity in DOM evaluation.

---

## Overall Verdict

| Fix | Check | Result |
|-----|-------|--------|
| FIX 1 | Newest row at bottom (index 5, opacity 1.0) | PASS |
| FIX 1 | Opacity ramp ascending top→bottom | PASS |
| FIX 1 | style-assert live DOM @1440 (exit 0) | PASS |
| FIX 1 | style-assert live DOM @1280 (exit 0) | PASS |
| FIX 1 | Console errors | 0 |
| FIX 2 | 20 default suggestions on open | PASS (20 items) |
| FIX 2 | No empty "Nhập tên" placeholder | PASS |
| FIX 2 | Filter-on-type narrows results | PASS (20→1 on "Tr") |
| FIX 2 | Console errors | 0 |

**OVERALL: PASS** — both fixes verified on live prod build with real seeded data and authed session.
