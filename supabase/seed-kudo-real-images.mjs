// seed-kudo-real-images.mjs — tải 20 ảnh THẬT (picsum) → upload vào bucket `kudo-images`
// → gán random 1–2 (đôi khi tới 5) ảnh cho MỖI kudo (insert kudo_images rows).
//
// Storage SELECT policy cho phép authenticated đọc BẤT KỲ object trong bucket
// (using bucket_id='kudo-images'), nên 20 ảnh dùng chung path đơn giản `demo-gallery/img-NN.jpg`
// và nhiều kudo trỏ chung được — chỉ 20 upload, không nhân bản.
//
// Idempotent: upload upsert=true; xoá sạch kudo_images cũ rồi seed lại.
//
// Run:  SUPABASE_URL=<cloud> SUPABASE_SERVICE_ROLE_KEY=<sb_secret_...> node supabase/seed-kudo-real-images.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const BUCKET = 'kudo-images'
// 20 ảnh thật, đa dạng (Lorem Picsum — ảnh stock thật).
const PICSUM_IDS = [10, 20, 28, 42, 58, 96, 111, 133, 160, 180, 201, 225, 250, 290, 312, 360, 401, 435, 502, 660]

// ---- 1) tải + upload 20 ảnh thật vào bucket ----
const paths = []
for (let i = 0; i < PICSUM_IDS.length; i++) {
  const url = `https://picsum.photos/id/${PICSUM_IDS[i]}/900/600.jpg`
  const res = await fetch(url)
  if (!res.ok) { console.error(`  download FAIL id=${PICSUM_IDS[i]} (${res.status})`); continue }
  const buf = Buffer.from(await res.arrayBuffer())
  const path = `demo-gallery/img-${String(i + 1).padStart(2, '0')}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType: 'image/jpeg', upsert: true,
  })
  if (error) { console.error(`  upload FAIL ${path}: ${error.message}`); continue }
  paths.push(path)
  console.log(`  uploaded ${path} (${buf.length} bytes)`)
}
if (paths.length === 0) { console.error('No images uploaded — abort'); process.exit(1) }
console.log(`\nUploaded ${paths.length} real images.\n`)

// ---- 2) lấy tất cả kudo id ----
const { data: kudos, error: kErr } = await supabase.from('kudos').select('id')
if (kErr) { console.error('fetch kudos:', kErr.message); process.exit(1) }
console.log(`Found ${kudos.length} kudos.`)

// ---- 3) xoá sạch kudo_images cũ (placeholder vỡ) ----
const { error: dErr } = await supabase.from('kudo_images').delete().gte('sort_order', 0)
if (dErr) { console.error('clear kudo_images:', dErr.message); process.exit(1) }
console.log('Cleared old kudo_images.')

// ---- 4) gán random 1–2 (15% tới 3–5) ảnh cho mỗi kudo ----
const pick = (arr, n) => {
  const pool = [...arr]
  const out = []
  for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
  return out
}
const rows = []
for (const k of kudos) {
  let n = 1 + Math.floor(Math.random() * 2)          // 1 hoặc 2
  if (Math.random() < 0.15) n = 3 + Math.floor(Math.random() * 3) // 15% → 3–5
  const chosen = pick(paths, Math.min(n, paths.length))
  chosen.forEach((p, idx) => rows.push({ kudo_id: k.id, storage_path: p, sort_order: idx }))
}

// ---- 5) insert theo batch ----
let inserted = 0
for (let i = 0; i < rows.length; i += 500) {
  const batch = rows.slice(i, i + 500)
  const { error } = await supabase.from('kudo_images').insert(batch)
  if (error) { console.error('insert batch:', error.message); process.exit(1) }
  inserted += batch.length
}
console.log(`\nInserted ${inserted} kudo_images rows across ${kudos.length} kudos.`)
console.log(`Avg ${(inserted / kudos.length).toFixed(2)} images/kudo.`)
process.exit(0)
