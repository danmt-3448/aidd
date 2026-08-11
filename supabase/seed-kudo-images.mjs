// seed-kudo-images.mjs — upload placeholder PNGs to the `kudo-images` storage bucket.
//
// Uploads 4 minimal placeholder PNG files so kudo_images rows (inserted by
// seed-demo-data.sql) resolve to real storage objects — the card gallery
// renders <img> tags that load actual bytes rather than broken src paths.
//
// Storage paths match the kudo_images rows in seed-demo-data.sql:
//   {sender_uid}/{kudo_id}/{file}.png
//
// Idempotent: upload with upsert=true overwrites existing files silently.
//
// Run:  node --env-file=.env.local supabase/seed-kudo-images.mjs
//   or: npm run seed:images   (add to package.json if desired)

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  'http://127.0.0.1:54321'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error(
    'Missing SUPABASE_SERVICE_ROLE_KEY. Run via `node --env-file=.env.local supabase/seed-kudo-images.mjs`.',
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Minimal valid PNG — 1×1 transparent pixel.
// Bytes: PNG signature + IHDR (1x1, 8-bit RGBA) + IDAT (single transparent pixel) + IEND.
const PLACEHOLDER_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6260000000020001e221bc330000000049454e44ae426082',
  'hex',
)

const UPLOADS = [
  {
    path: '11111111-0000-0000-0000-000000000001/cccccccc-0000-4000-8000-000000000910/photo1.png',
    label: 'kudo 910 (user 1 → user 12)',
  },
  {
    path: '11111111-0000-0000-0000-000000000003/cccccccc-0000-4000-8000-000000000911/photo1.png',
    label: 'kudo 911 (user 3 → user 13)',
  },
  {
    path: '0000000e-0000-4000-8000-00000000000e/cccccccc-0000-4000-8000-000000000912/photo1.png',
    label: 'kudo 912 (user 14 → user 5)',
  },
  {
    path: '00000012-0000-4000-8000-000000000012/cccccccc-0000-4000-8000-000000000913/photo1.png',
    label: 'kudo 913 (user 18 → user 8)',
  },
]

const BUCKET = 'kudo-images'

let uploaded = 0
let failed = 0

for (const { path, label } of UPLOADS) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, PLACEHOLDER_PNG, {
      contentType: 'image/png',
      upsert: true,
    })

  if (error) {
    console.error(`  FAILED  ${label}: ${error.message}`)
    failed += 1
  } else {
    console.log(`  uploaded  ${label}`)
    uploaded += 1
  }
}

console.log(
  `\nseed-kudo-images: ${uploaded} uploaded, ${failed} failed (of ${UPLOADS.length}).`,
)
process.exit(failed > 0 ? 1 : 0)
