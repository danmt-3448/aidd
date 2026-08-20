# Phase 04 — Tooling read-only DB

## Overview
- **Priority:** P4 (Tooling 6.5→~8)
- **Status:** code-complete, runtime-verification pending
- Hiện agent đọc DB qua `psql *` (full quyền). Cấp **role read-only** để agent đọc an toàn, không ghi nhầm. Migration written; runtime test deferred (Supabase local down).

## Key insights
- Local dev = Supabase (Postgres). `supabase/migrations/` là source of truth.
- Permission `.claude/settings.json` cho `Bash(psql *)` — không phân biệt read/write.
- Mục tiêu: 1 DB role chỉ SELECT + kết nối qua role đó cho debug/inspection.

## Requirements
- FR1: Migration tạo role `aidd_readonly` (LOGIN, password local-only) với `GRANT SELECT` trên schema `public` (+ default privileges cho bảng tương lai), REVOKE mọi quyền ghi.
- FR2: Tài liệu hoá cách connect bằng role read-only (connection string local) trong docs — KHÔNG commit password thật (dùng placeholder/`.env.local`).
- FR3: (tuỳ) permission allowlist ưu tiên psql qua role read-only cho tác vụ inspect.
- NFR: Chỉ ảnh hưởng local dev; không đụng prod (Supabase hosted quản role riêng).

## Architecture
```
supabase/migrations/<ts>_readonly_role.sql   # CREATE ROLE + GRANT SELECT + ALTER DEFAULT PRIVILEGES
docs/ (database-schema.md hoặc getting-started)  # cách dùng role read-only, placeholder creds
```
- Role read-only áp cho DB introspection của agent; migration/seed vẫn dùng role mặc định.

## Related code files
- **Create:** `supabase/migrations/<ts>_readonly_role.sql`
- **Modify:** `docs/database-schema.md` (mục "Read-only access for agents"), có thể `.claude/settings.json` (note psql read-only usage)
- **Delete:** none

## Implementation steps
1. **Role tạo có guard idempotent** (roles là cluster-global, `db:reset` KHÔNG drop role → `CREATE ROLE` trần sẽ lỗi "already exists" ở lần reset thứ 2). Dùng DO block:
   ```sql
   DO $$ BEGIN
     IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'aidd_readonly') THEN
       CREATE ROLE aidd_readonly LOGIN PASSWORD 'changeme_local_only';  -- placeholder, local-only, KHÔNG dùng prod
     END IF;
   END $$;
   GRANT USAGE ON SCHEMA public TO aidd_readonly;
   ```
2. **Cover CẢ bảng hiện có LẪN bảng tương lai** (`ALTER DEFAULT PRIVILEGES` chỉ áp bảng do role-chạy-migration tạo → owner gap):
   ```sql
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO aidd_readonly;           -- bảng hiện có, mọi owner
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO aidd_readonly;  -- bảng tương lai
   ```
   Nếu bảng tạo bởi nhiều owner khác nhau → chạy lại `GRANT SELECT ON ALL TABLES` ở cuối `db:reset` (seed step) để chắc chắn phủ hết. Verify không có INSERT/UPDATE/DELETE grant.
3. `npm run db:reset` áp migration **2 lần liên tiếp** → xác nhận KHÔNG lỗi "role already exists". Connect role read-only: `INSERT` bị từ chối, `SELECT` OK, phủ mọi bảng.
4. Ghi docs cách dùng (placeholder password rõ là local-only; không commit password thật).

## Todo
- [x] migration readonly role — DONE: `supabase/migrations/20260820000000_readonly_role.sql` written with idempotent DO-block guard + GRANT SELECT ALL TABLES + ALTER DEFAULT PRIVILEGES + REVOKE writes
- [ ] db:reset áp + verify SELECT ok / write denied — DEFERRED (Supabase local down; migration logic-reviewed by code-reviewer, deployment blocked until Supabase brought up)
- [ ] docs hướng dẫn (no real secret) — DEFERRED (tied to runtime verification; placeholder `changeme_local_only` documented in migration file)

## Success criteria
- `npm run db:reset` chạy **2 lần** không lỗi "role already exists" (guard DO block hoạt động).
- Connect role `aidd_readonly`: `SELECT` chạy trên **mọi bảng** (phủ owner gap), `INSERT/UPDATE/DELETE` bị từ chối.
- Không commit password thật (placeholder `changeme_local_only`, local-only).

## Risk
- **Password trong migration:** dùng password local cố định vô hại (local-only) hoặc tạo qua `DO` block đọc env; KHÔNG dùng cho prod. Ghi rõ scope local.
- **Default privileges chỉ áp bảng tạo bởi role chạy migration:** ghi chú, chạy `ALTER DEFAULT PRIVILEGES` đúng owner.

## Security
- Role read-only giảm blast radius agent. Không mở port ngoài. Prod không dùng migration này để tạo creds.

## Next steps
- Độc lập. Đóng plan sau khi 4 phase xong → chuyển test-runner + reviewer trước khi merge nhánh.
