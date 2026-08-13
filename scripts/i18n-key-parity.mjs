#!/usr/bin/env node
/**
 * i18n key parity: merge mọi messages/vi/*.json và messages/en/*.json rồi so
 * tập key phẳng (dot-path) giữa 2 locale. In key thiếu 2 chiều.
 * exit 0 = khớp; exit 1 = lệch. Dùng ở Phase 13 (integration verify).
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'messages')

function flatten(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, path, out)
    else out.add(path)
  }
}

function loadLocale(locale) {
  const dir = join(root, locale)
  const keys = new Set()
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const json = JSON.parse(readFileSync(join(dir, file), 'utf8'))
    flatten(json, '', keys)
  }
  return keys
}

const vi = loadLocale('vi')
const en = loadLocale('en')

const missingInEn = [...vi].filter((k) => !en.has(k)).sort()
const missingInVi = [...en].filter((k) => !vi.has(k)).sort()

if (missingInEn.length === 0 && missingInVi.length === 0) {
  console.log(`i18n parity OK — ${vi.size} keys, vi ≡ en`)
  process.exit(0)
}

if (missingInEn.length) {
  console.error(`\nMissing in EN (${missingInEn.length}):`)
  for (const k of missingInEn) console.error(`  - ${k}`)
}
if (missingInVi.length) {
  console.error(`\nMissing in VI (${missingInVi.length}):`)
  for (const k of missingInVi) console.error(`  - ${k}`)
}
process.exit(1)
