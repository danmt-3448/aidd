# UI-First Gate — /board (Sun* Kudos Live board, MaZUn5xHXZ) — **FAIL** (run 4, localhost)

Port: **localhost:3001** (lần đầu gate board trên path hydrate đúng) · ref node 2940:13431 · artboard 1440×5862 · app 1440×**8622**.

## A. Visual — **23.33% (FAIL)**
- `?ui_state=full` **populate đúng** (mock data chạy): KV banner "KUDOS", HIGHLIGHT KUDOS, SPOTLIGHT BOARD (Trần Thị Bình / Đỗ Quang Huy / Hoàng Thị Lan), ALL KUDOS list dày + sidebar stats.
- **App cao 8622 vs ref 5862 (+2760px)** → card kudos cao/spacing dày hơn Figma, hoặc list dài hơn density Figma. Diff 23.33% (khớp run3 cũ 24.6%).

## B. Behavior — **FAIL (bug thật)**
- ⛔ **91 console errors** trên localhost (KHÔNG phải HMR): `Encountered two children with the same key #Dedicated / #Inspring` → **duplicate React key** khi render hashtag (mock data trùng hashtag → key không unique). Bug thật, phải fix (dùng key unique = index/id thay vì tên hashtag).

## Verdict: **FAIL** — visual 23.33% (card height/density lệch) + 91 duplicate-key errors (hashtag render). 
## Fix → fe-developer:
1. Fix duplicate key ở hashtag list (key = `${kudoId}-${idx}` thay vì hashtag text).
2. Đối chiếu card kudos height/spacing vs node 2940:13431 (app dày hơn 2760px).
3. (Đã biết từ run1-3: highlight carousel 3-up, spotlight, KV banner — xem `ui-gate-260805-board*.md`).
