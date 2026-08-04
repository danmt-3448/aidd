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
const USERS = [
  { id: '11111111-0000-0000-0000-000000000001', email: 'nguyen.van.an@sun-asterisk.com', full_name: 'Nguyễn Văn An', seed: 'NguyenVanAn', is_admin: true },
  { id: '11111111-0000-0000-0000-000000000002', email: 'tran.thi.binh@sun-asterisk.com', full_name: 'Trần Thị Bình', seed: 'TranThiBinh' },
  { id: '11111111-0000-0000-0000-000000000003', email: 'le.van.cuong@sun-asterisk.com', full_name: 'Lê Văn Cường', seed: 'LeVanCuong' },
  { id: '11111111-0000-0000-0000-000000000004', email: 'pham.thi.dung@sun-asterisk.com', full_name: 'Phạm Thị Dung', seed: 'PhamThiDung' },
  { id: '11111111-0000-0000-0000-000000000005', email: 'hoang.van.em@sun-asterisk.com', full_name: 'Hoàng Văn Em', seed: 'HoangVanEm' },
  { id: '11111111-0000-0000-0000-000000000006', email: 'vo.thi.phuong@sun-asterisk.com', full_name: 'Võ Thị Phương', seed: 'VoThiPhuong' },
  { id: '11111111-0000-0000-0000-000000000007', email: 'dang.van.giang@sun-asterisk.com', full_name: 'Đặng Văn Giang', seed: 'DangVanGiang' },
  { id: '11111111-0000-0000-0000-000000000008', email: 'bui.thi.huong@sun-asterisk.com', full_name: 'Bùi Thị Hương', seed: 'BuiThiHuong' },
  { id: '11111111-0000-0000-0000-000000000009', email: 'dinh.van.ien@sun-asterisk.com', full_name: 'Đinh Văn Iên', seed: 'DinhVanIen' },
  { id: '11111111-0000-0000-0000-000000000010', email: 'ngo.thi.khanh@sun-asterisk.com', full_name: 'Ngô Thị Khánh', seed: 'NgoThiKhanh' },
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

// Mark admin users via shell SQL (RLS prevents service role from updating)
import { execSync } from 'child_process'

const adminUsers = USERS.filter((u) => u.is_admin)
if (adminUsers.length > 0) {
  try {
    for (const u of adminUsers) {
      const sql = `UPDATE public.profiles SET is_admin = true WHERE id = '${u.id}';`
      execSync(`psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "${sql}"`, {
        stdio: 'pipe',
      })
      console.log(`  admin    ${u.email}`)
    }
  } catch (err) {
    console.error(`WARNING: failed to set admin flags: ${err.message}`)
  }
}

console.log(
  `\nseed-auth-users: ${created} created, ${skipped} skipped, ${failed} failed (of ${USERS.length}).`,
)
process.exit(failed > 0 ? 1 : 0)
