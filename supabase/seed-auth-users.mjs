// Seed auth users via the Supabase GoTrue admin API (auth.admin.createUser).
//
// WHY NOT raw SQL: inserting into auth.users directly leaves GoTrue token
// columns (confirmation_token, recovery_token, instance_id, ...) NULL, which
// breaks GoTrue's row scanner → every sign-in returns "invalid credentials".
// The admin API creates native, complete rows — no NULL-token workaround.
//
// Idempotent: skips users that already exist (safe to re-run).
// Fixed UUIDs are honored by the admin API (verified) so integration tests in
// supabase/tests/*.sql that reference 11111111-...-00N keep working.
// profiles rows are auto-created by the handle_new_user trigger.
//
// Run:  npm run seed:auth        (loads .env.local via node --env-file)
//   or: npm run db:reset         (supabase db reset + this script)

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  'http://127.0.0.1:54321'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error(
    'Missing SUPABASE_SERVICE_ROLE_KEY. Run via `npm run seed:auth` (loads .env.local).',
  )
  process.exit(1)
}

const PASSWORD = 'TestPass123!'
const avatar = (seed) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`

// Fixed UUIDs preserved from the previous SQL seed (integration tests depend on them).
// Users 1–10: original version-0 ids — kept for backward compat; now covered by .guid() validation.
// Users 11–30: valid RFC-4122 v4 format (xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx).
// department_ref: fixed UUIDs matching the seed rows in 20260804040000_create_departments.sql.
const DEPT = {
  engineering:  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  product:      'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  design:       'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  qa:           'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
  devops:       'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
  data:         'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
  management:   'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
}

const USERS = [
  // ── Original 10 (version-0 ids — kept for backward compat) ────────────────
  { id: '11111111-0000-0000-0000-000000000001', email: 'nguyen.van.an@sun-asterisk.com',     full_name: 'Nguyễn Văn An',      seed: 'NguyenVanAn',    is_admin: true, department_ref: DEPT.engineering },
  { id: '11111111-0000-0000-0000-000000000002', email: 'tran.thi.binh@sun-asterisk.com',     full_name: 'Trần Thị Bình',      seed: 'TranThiBinh',              department_ref: DEPT.product },
  { id: '11111111-0000-0000-0000-000000000003', email: 'le.van.cuong@sun-asterisk.com',      full_name: 'Lê Văn Cường',       seed: 'LeVanCuong',               department_ref: DEPT.design },
  { id: '11111111-0000-0000-0000-000000000004', email: 'pham.thi.dung@sun-asterisk.com',     full_name: 'Phạm Thị Dung',      seed: 'PhamThiDung',              department_ref: DEPT.qa },
  { id: '11111111-0000-0000-0000-000000000005', email: 'hoang.van.em@sun-asterisk.com',      full_name: 'Hoàng Văn Em',       seed: 'HoangVanEm',               department_ref: DEPT.devops },
  { id: '11111111-0000-0000-0000-000000000006', email: 'vo.thi.phuong@sun-asterisk.com',     full_name: 'Võ Thị Phương',      seed: 'VoThiPhuong',              department_ref: DEPT.data },
  { id: '11111111-0000-0000-0000-000000000007', email: 'dang.van.giang@sun-asterisk.com',    full_name: 'Đặng Văn Giang',     seed: 'DangVanGiang',             department_ref: DEPT.management },
  { id: '11111111-0000-0000-0000-000000000008', email: 'bui.thi.huong@sun-asterisk.com',     full_name: 'Bùi Thị Hương',      seed: 'BuiThiHuong',              department_ref: DEPT.engineering },
  { id: '11111111-0000-0000-0000-000000000009', email: 'dinh.van.ien@sun-asterisk.com',      full_name: 'Đinh Văn Iên',       seed: 'DinhVanIen',               department_ref: DEPT.product },
  { id: '11111111-0000-0000-0000-000000000010', email: 'ngo.thi.khanh@sun-asterisk.com',     full_name: 'Ngô Thị Khánh',      seed: 'NgoThiKhanh',              department_ref: DEPT.design },
  // ── New 20 (valid RFC-4122 v4 UUIDs: version nibble = 4, variant nibble = 8) ─
  { id: '0000000b-0000-4000-8000-00000000000b', email: 'ly.van.long@sun-asterisk.com',       full_name: 'Lý Văn Long',        seed: 'LyVanLong',                department_ref: DEPT.qa },
  { id: '0000000c-0000-4000-8000-00000000000c', email: 'mai.thi.mai@sun-asterisk.com',       full_name: 'Mai Thị Mai',        seed: 'MaiThiMai',                department_ref: DEPT.devops },
  { id: '0000000d-0000-4000-8000-00000000000d', email: 'nguyen.thi.nga@sun-asterisk.com',    full_name: 'Nguyễn Thị Nga',     seed: 'NguyenThiNga',             department_ref: DEPT.data },
  { id: '0000000e-0000-4000-8000-00000000000e', email: 'phan.van.oanh@sun-asterisk.com',     full_name: 'Phan Văn Oánh',      seed: 'PhanVanOanh',              department_ref: DEPT.management },
  { id: '0000000f-0000-4000-8000-00000000000f', email: 'quach.thi.phuong@sun-asterisk.com',  full_name: 'Quách Thị Phương',   seed: 'QuachThiPhuong',           department_ref: DEPT.engineering },
  { id: '00000010-0000-4000-8000-000000000010', email: 'rao.van.quang@sun-asterisk.com',     full_name: 'Rao Văn Quang',      seed: 'RaoVanQuang',              department_ref: DEPT.product },
  { id: '00000011-0000-4000-8000-000000000011', email: 'sinh.thi.rong@sun-asterisk.com',     full_name: 'Sinh Thị Rồng',      seed: 'SinhThiRong',              department_ref: DEPT.design },
  { id: '00000012-0000-4000-8000-000000000012', email: 'trinh.van.son@sun-asterisk.com',     full_name: 'Trịnh Văn Sơn',      seed: 'TrinhVanSon',              department_ref: DEPT.qa },
  { id: '00000013-0000-4000-8000-000000000013', email: 'uyen.thi.tam@sun-asterisk.com',      full_name: 'Uyên Thị Tâm',       seed: 'UyenThiTam',               department_ref: DEPT.devops },
  { id: '00000014-0000-4000-8000-000000000014', email: 'vuong.van.tuyen@sun-asterisk.com',   full_name: 'Vương Văn Tuyền',    seed: 'VuongVanTuyen',            department_ref: DEPT.data },
  { id: '00000015-0000-4000-8000-000000000015', email: 'xuan.thi.uyen@sun-asterisk.com',     full_name: 'Xuân Thị Uyên',      seed: 'XuanThiUyen',              department_ref: DEPT.management },
  { id: '00000016-0000-4000-8000-000000000016', email: 'yen.van.vinh@sun-asterisk.com',      full_name: 'Yên Văn Vĩnh',       seed: 'YenVanVinh',               department_ref: DEPT.engineering },
  { id: '00000017-0000-4000-8000-000000000017', email: 'an.thi.xuan@sun-asterisk.com',       full_name: 'An Thị Xuân',        seed: 'AnThiXuan',                department_ref: DEPT.product },
  { id: '00000018-0000-4000-8000-000000000018', email: 'binh.van.yen@sun-asterisk.com',      full_name: 'Bình Văn Yên',       seed: 'BinhVanYen',               department_ref: DEPT.design },
  { id: '00000019-0000-4000-8000-000000000019', email: 'cuong.thi.chi@sun-asterisk.com',     full_name: 'Cường Thị Chi',      seed: 'CuongThiChi',              department_ref: DEPT.qa },
  { id: '0000001a-0000-4000-8000-00000000001a', email: 'dung.van.dat@sun-asterisk.com',      full_name: 'Dũng Văn Đạt',       seed: 'DungVanDat',               department_ref: DEPT.devops },
  { id: '0000001b-0000-4000-8000-00000000001b', email: 'em.thi.dieu@sun-asterisk.com',       full_name: 'Em Thị Diệu',        seed: 'EmThiDieu',                department_ref: DEPT.data },
  { id: '0000001c-0000-4000-8000-00000000001c', email: 'giang.van.dong@sun-asterisk.com',    full_name: 'Giang Văn Đông',     seed: 'GiangVanDong',             department_ref: DEPT.management },
  { id: '0000001d-0000-4000-8000-00000000001d', email: 'huong.thi.giao@sun-asterisk.com',    full_name: 'Hương Thị Giáo',     seed: 'HuongThiGiao',             department_ref: DEPT.engineering },
  { id: '0000001e-0000-4000-8000-00000000001e', email: 'ien.van.ha@sun-asterisk.com',        full_name: 'Iên Văn Hà',         seed: 'IenVanHa',                 department_ref: DEPT.product },
]

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const isAlreadyRegistered = (message = '') =>
  /already been registered|already exists|duplicate/i.test(message)

let created = 0
let skipped = 0
let failed = 0

for (const u of USERS) {
  const { error } = await admin.auth.admin.createUser({
    id: u.id,
    email: u.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: u.full_name, avatar_url: avatar(u.seed) },
  })

  if (!error) {
    created += 1
    console.log(`  created  ${u.email}`)
  } else if (isAlreadyRegistered(error.message)) {
    skipped += 1
    console.log(`  skipped  ${u.email} (already exists)`)
  } else {
    failed += 1
    console.error(`  FAILED   ${u.email}: ${error.message}`)
  }
}

// Post-create SQL operations via psql.
//
// WHY explicit upsert rather than relying on handle_new_user trigger:
//   `supabase db reset` wipes public.profiles but GoTrue (auth) persists users
//   across resets. "Skipped" users (already in GoTrue) have no profile row after
//   reset because the INSERT trigger only fires on auth.users INSERT — not on DB
//   reset recovery. We must upsert profiles unconditionally for all 30 users.
import { execSync } from 'child_process'

const PG = 'psql postgresql://postgres:postgres@127.0.0.1:54322/postgres'

// Upsert profiles for ALL users (covers both newly created and skipped/pre-existing).
// avatar_url mirrors the dicebear URL generated in user_metadata (handle_new_user
// reads raw_user_meta_data->>'avatar_url', so this stays consistent).
console.log('\nUpserting profiles…')
try {
  const profileSql = USERS.map((u) => {
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.seed}`
    const isAdmin = u.is_admin ? 'true' : 'false'
    return (
      `INSERT INTO public.profiles (id, full_name, avatar_url, is_admin) ` +
      `VALUES ('${u.id}', '${u.full_name.replace(/'/g, "''")}', '${avatarUrl}', ${isAdmin}) ` +
      `ON CONFLICT (id) DO UPDATE SET ` +
      `  full_name = EXCLUDED.full_name, ` +
      `  avatar_url = EXCLUDED.avatar_url, ` +
      `  is_admin = EXCLUDED.is_admin;`
    )
  }).join(' ')
  execSync(`${PG} -c "${profileSql}"`, { stdio: 'pipe' })
  console.log(`  profiles: upserted ${USERS.length} rows`)
} catch (err) {
  console.error(`WARNING: failed to upsert profiles: ${err.message}`)
}

// Backfill department_ref on profiles rows.
// department UUIDs come from 20260804040000_create_departments.sql (fixed ids).
console.log('\nBackfilling department_ref…')
try {
  const deptSql = USERS
    .filter((u) => u.department_ref)
    .map((u) =>
      `UPDATE public.profiles SET department_ref = '${u.department_ref}' WHERE id = '${u.id}';`
    )
    .join(' ')
  if (deptSql) {
    execSync(`${PG} -c "${deptSql}"`, { stdio: 'pipe' })
    console.log(`  department_ref: backfilled ${USERS.length} users`)
  }
} catch (err) {
  console.error(`WARNING: failed to backfill department_ref: ${err.message}`)
}

// Grant 5 unopened secret boxes to each demo user so the sidebar counter shows "05"
// (matching the Figma reference for the demo/seed state, per phase-03 requirements).
// Runs AFTER profiles upsert — secret_box has FK → profiles.
// The grant is idempotent: ON CONFLICT DO NOTHING.
// Real users' counts are managed exclusively by the open_secret_box RPC.
console.log('\nSeeding secret_box grants…')
try {
  const secretBoxSql = USERS.map((u) =>
    `INSERT INTO public.secret_box (user_id, unopened_box_count) ` +
    `VALUES ('${u.id}', 5) ON CONFLICT (user_id) DO NOTHING;`
  ).join(' ')
  execSync(`${PG} -c "${secretBoxSql}"`, { stdio: 'pipe' })
  console.log(`  secret_box: granted 5 unopened boxes to ${USERS.length} users`)
} catch (err) {
  console.error(`WARNING: failed to seed secret_box grants: ${err.message}`)
}

console.log(
  `\nseed-auth-users: ${created} created, ${skipped} skipped, ${failed} failed (of ${USERS.length}).`,
)
process.exit(failed > 0 ? 1 : 0)
