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
// department_ref: fixed UUIDs matching the seed rows in 20260804040000_create_departments.sql.
const USERS = [
  { id: '11111111-0000-0000-0000-000000000001', email: 'nguyen.van.an@sun-asterisk.com', full_name: 'Nguyễn Văn An', seed: 'NguyenVanAn', is_admin: true, department_ref: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
  { id: '11111111-0000-0000-0000-000000000002', email: 'tran.thi.binh@sun-asterisk.com', full_name: 'Trần Thị Bình', seed: 'TranThiBinh', department_ref: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' },
  { id: '11111111-0000-0000-0000-000000000003', email: 'le.van.cuong@sun-asterisk.com', full_name: 'Lê Văn Cường', seed: 'LeVanCuong', department_ref: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33' },
  { id: '11111111-0000-0000-0000-000000000004', email: 'pham.thi.dung@sun-asterisk.com', full_name: 'Phạm Thị Dung', seed: 'PhamThiDung', department_ref: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44' },
  { id: '11111111-0000-0000-0000-000000000005', email: 'hoang.van.em@sun-asterisk.com', full_name: 'Hoàng Văn Em', seed: 'HoangVanEm', department_ref: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55' },
  { id: '11111111-0000-0000-0000-000000000006', email: 'vo.thi.phuong@sun-asterisk.com', full_name: 'Võ Thị Phương', seed: 'VoThiPhuong', department_ref: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66' },
  { id: '11111111-0000-0000-0000-000000000007', email: 'dang.van.giang@sun-asterisk.com', full_name: 'Đặng Văn Giang', seed: 'DangVanGiang', department_ref: 'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77' },
  { id: '11111111-0000-0000-0000-000000000008', email: 'bui.thi.huong@sun-asterisk.com', full_name: 'Bùi Thị Hương', seed: 'BuiThiHuong', department_ref: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
  { id: '11111111-0000-0000-0000-000000000009', email: 'dinh.van.ien@sun-asterisk.com', full_name: 'Đinh Văn Iên', seed: 'DinhVanIen', department_ref: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' },
  { id: '11111111-0000-0000-0000-000000000010', email: 'ngo.thi.khanh@sun-asterisk.com', full_name: 'Ngô Thị Khánh', seed: 'NgoThiKhanh', department_ref: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33' },
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

// Post-create SQL operations via psql (RLS prevents service role from writing profiles).
// These run after all users are created so every profiles row (created by the
// handle_new_user trigger) already exists.
import { execSync } from 'child_process'

const PG = 'psql postgresql://postgres:postgres@127.0.0.1:54322/postgres'

// Mark admin users.
const adminUsers = USERS.filter((u) => u.is_admin)
if (adminUsers.length > 0) {
  try {
    for (const u of adminUsers) {
      const sql = `UPDATE public.profiles SET is_admin = true WHERE id = '${u.id}';`
      execSync(`${PG} -c "${sql}"`, { stdio: 'pipe' })
      console.log(`  admin    ${u.email}`)
    }
  } catch (err) {
    console.error(`WARNING: failed to set admin flags: ${err.message}`)
  }
}

// Grant 5 unopened secret boxes to each demo user so the sidebar counter shows "05"
// (matching the Figma reference for the demo/seed state, per phase-03 requirements).
// The grant is idempotent: INSERT ... ON CONFLICT DO NOTHING.
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

// Backfill department_ref on profiles rows (created by handle_new_user trigger above).
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

console.log(
  `\nseed-auth-users: ${created} created, ${skipped} skipped, ${failed} failed (of ${USERS.length}).`,
)
process.exit(failed > 0 ? 1 : 0)
