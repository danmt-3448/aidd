#!/usr/bin/env node
/**
 * regate.mjs — push-button property-diff re-gate sweep across all built screens.
 *
 * Reads plans/reports/_gate-ref/regate.config.json, then for each non-held screen:
 *   capture-code.mjs (1440 + 1280, per-screen vh) → style-assert.mjs
 *   + overflow probe at 1440/1280/1920.
 * Prints a PASS/FAIL/HELD table. No per-run overrides needed — selmaps + vh live in the config
 * and nodemap/{screen}.selmap.json (auto-loaded by capture-code.mjs).
 *
 * Precondition: dev server up (npm run dev, http://localhost:3001).
 * Usage: node .claude/skills/aidd-ui-gate/scripts/regate.mjs
 * Exit: 0 all measurable screens PASS · 1 any FAIL · 2 dev server down / config error.
 */
import { readFileSync, mkdtempSync } from 'node:fs'
import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..', '..', '..') // repo root from .claude/skills/aidd-ui-gate/scripts
const NM = join(ROOT, 'plans/reports/_gate-ref/nodemap')
const CAP = join(HERE, 'capture-code.mjs')
const ASSERT = join(HERE, 'style-assert.mjs')
const cfgPath = join(ROOT, 'plans/reports/_gate-ref/regate.config.json')

const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'))
const base = cfg.base || 'http://127.0.0.1:3001'
const out = mkdtempSync(join(tmpdir(), 'regate-'))

// Dev server up? Hit the first screen route (follow redirects; bare / redirects to auth).
const probeRoute = (cfg.screens[0]?.route || '/login')
try {
  execFileSync('curl', ['-sfL', '-o', '/dev/null', `${base}${probeRoute}?ui_state=full`], { timeout: 8000 })
} catch {
  console.error(`[regate] dev server DOWN at ${base}. Start it: npm run dev`)
  process.exit(2)
}

function capture(screen, route, viewport, mapFile, vh) {
  const outFile = join(out, `${screen}.${viewport}.json`)
  const args = [CAP, '--screen', screen, '--route', route, '--map', join(NM, mapFile),
    '--nodemap', join(NM, `${screen}.nodemap.json`), '--viewport', String(viewport), '--out', outFile, '--base', base]
  if (vh) args.push('--vh', String(vh))
  let meta = {}
  const r = spawnSync('node', args, { encoding: 'utf8' }) // capture-code prints meta JSON to stderr
  try {
    meta = JSON.parse((r.stderr || '').trim().split('\n').pop() || '{}')
  } catch {
    meta = { error: (r.stderr || r.error?.message || '').toString().slice(0, 80) }
  }
  return { outFile, meta }
}

function assert(outFile, label) {
  try {
    execFileSync('node', [ASSERT, '--map', outFile, '--min-elements', '5', '--screen', label], { stdio: 'ignore' })
    return 'PASS'
  } catch (e) {
    return `FAIL(${e.status})`
  }
}

const rows = []
for (const s of cfg.screens) {
  if (s.held) { rows.push({ screen: s.screen, v: 'HELD', note: s.held }); continue }
  const vh1440 = s.vh?.['1440']
  const vh1280 = s.vh?.['1280']
  const c14 = capture(s.screen, s.route, 1440, `${s.screen}.map.json`, vh1440)
  const a14 = assert(c14.outFile, `${s.screen}-1440`)
  const c12 = capture(s.screen, s.route, 1280, `${s.screen}.map.1280.json`, vh1280)
  const a12 = assert(c12.outFile, `${s.screen}-1280`)
  const c19 = capture(s.screen, s.route, 1920, `${s.screen}.map.json`, vh1440)
  const ov = [c14.meta.overflow, c12.meta.overflow, c19.meta.overflow].map((x) => x || '?').join('/')
  const pass = a14 === 'PASS' && a12 === 'PASS' && !/OVERFLOW/.test(ov)
  rows.push({ screen: s.screen, v: pass ? 'PASS' : 'FAIL', d: `1440=${a14} 1280=${a12} ovf=${ov}` })
}

console.log(`\nUI-First Gate — re-gate sweep · base ${base}\n`)
console.log('screen'.padEnd(12), 'verdict'.padEnd(9), 'detail')
console.log('-'.repeat(72))
for (const r of rows) console.log(r.screen.padEnd(12), r.v.padEnd(9), r.d || r.note || '')
const failed = rows.filter((r) => r.v === 'FAIL')
const held = rows.filter((r) => r.v === 'HELD')
console.log('-'.repeat(72))
console.log(`PASS ${rows.filter((r) => r.v === 'PASS').length} · FAIL ${failed.length} · HELD ${held.length}`)
process.exit(failed.length ? 1 : 0)
