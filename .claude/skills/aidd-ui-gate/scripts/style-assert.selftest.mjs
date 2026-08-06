#!/usr/bin/env node
/**
 * Self-test for style-assert.mjs — verifies the gate flags the exact red-team cases
 * (wrong opaque color, wrong rgba alpha, wrong weight, asset-as-text, parent-opacity
 * compositing, missing element, empty map) and passes correct values. No deps.
 * Run: node style-assert.selftest.mjs   → exits 0 when all self-checks hold.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const SCRIPT = new URL('./style-assert.mjs', import.meta.url).pathname
const dir = mkdtempSync(join(tmpdir(), 'style-assert-'))

/** Run the gate on a map object; return { code, out }. */
function run(map, extra = []) {
  const f = join(dir, `m${Math.random().toString(36).slice(2)}.json`)
  writeFileSync(f, JSON.stringify(map))
  try {
    const out = execFileSync('node', [SCRIPT, '--map', f, ...extra], { encoding: 'utf8' })
    return { code: 0, out }
  } catch (e) {
    return { code: e.status ?? -1, out: (e.stdout || '') + (e.stderr || '') }
  }
}

let failures = 0
function expect(name, cond, detail = '') {
  if (cond) console.log(`  ✓ ${name}`)
  else {
    console.log(`  ✗ ${name} ${detail}`)
    failures++
  }
}

// 1. All-correct → exit 0
let r = run({
  'txt': { kind: 'style', code: { color: 'rgb(228, 0, 43)', fontWeight: '700', fontSize: '16px' }, design: { color: '#E4002B', fontWeight: 700, fontSize: '16px' } },
})
expect('correct values → PASS (exit 0)', r.code === 0, `(exit ${r.code})`)

// 2. Wrong opaque color → exit 1
r = run({ 'txt': { kind: 'style', code: { color: 'rgb(227, 6, 19)' }, design: { color: '#E4002B' } } })
expect('wrong opaque color → FAIL (exit 1)', r.code === 1, `(exit ${r.code})`)

// 3. Wrong rgba ALPHA (channels equal, alpha differs) → exit 1  [RT-5]
r = run({ 'pill': { kind: 'style', code: { bg: 'rgba(231, 57, 40, 0.30)' }, design: { bg: 'rgba(231,57,40,0.15)' } } })
expect('wrong rgba alpha → FAIL (not silent PASS)', r.code === 1, `(exit ${r.code})`)

// 4. Wrong font-weight (600 vs 700) → exit 1
r = run({ 'h': { kind: 'style', code: { fontWeight: '600' }, design: { fontWeight: 700 } } })
expect('weight 600 vs 700 → FAIL', r.code === 1, `(exit ${r.code})`)

// 5. Asset rendered as <div> → exit 1
r = run({ 'logo': { kind: 'asset', code: { tag: 'H1', src: null }, design: {} } })
expect('asset as <h1> → FAIL', r.code === 1, `(exit ${r.code})`)

// 5b. Asset as <img> with src → PASS
r = run({ 'logo': { kind: 'asset', code: { tag: 'IMG', src: '/logo.svg' }, design: {} } })
expect('asset as <img src> → PASS', r.code === 0, `(exit ${r.code})`)

// 6. Parent opacity 0.65 × white fill: code shows composited, design raw white+opacity  [RT-7]
//    design white a=1 with opacity 0.65 → effective a=0.65; code rgba white a=0.65 → should MATCH
r = run({ 'panel': { kind: 'style', code: { bg: 'rgba(255,255,255,0.65)' }, design: { bg: '#FFFFFF', opacity: 0.65 } } })
expect('parent-opacity composite → PASS when effective alpha matches', r.code === 0, `(exit ${r.code})`)
//    same but design opacity 1 → effective a=1 ≠ code 0.65 → FAIL
r = run({ 'panel': { kind: 'style', code: { bg: 'rgba(255,255,255,0.65)' }, design: { bg: '#FFFFFF', opacity: 1 } } })
expect('opacity mismatch → FAIL', r.code === 1, `(exit ${r.code})`)

// 7. Missing element (selector matched nothing) → exit 2 (coverage error)  [RT-1]
r = run({ 'gone': { kind: 'style', code: { missing: true }, design: { color: '#000' } } })
expect('missing element → exit 2', r.code === 2, `(exit ${r.code})`)

// 8. Empty map → exit 2 (never silent PASS)  [RT-1]
r = run({})
expect('empty map → exit 2 (no silent PASS)', r.code === 2, `(exit ${r.code})`)

// 9. --min-elements coverage floor → exit 2
r = run({ 'a': { kind: 'style', code: { color: 'rgb(0,0,0)' }, design: { color: '#000000' } } }, ['--min-elements', '5'])
expect('below --min-elements → exit 2', r.code === 2, `(exit ${r.code})`)

// 10. Icon fill mismatch → exit 1; unresolvable icon fill → exit 1  [RT-10]
r = run({ 'ic': { kind: 'icon', code: { iconFill: 'rgb(0,0,0)' }, design: { fill: '#E4002B' } } })
expect('icon wrong fill → FAIL', r.code === 1, `(exit ${r.code})`)
r = run({ 'ic': { kind: 'icon', code: { iconFill: null }, design: { fill: '#E4002B' } } })
expect('icon fill unresolvable → FAIL (not WARN)', r.code === 1, `(exit ${r.code})`)

// 11. Section height drift > 2px → exit 1  [RT-11]
r = run({ 'sec': { kind: 'section', code: { offsetHeight: '520' }, design: { height: '512' } } })
expect('section height Δ8px → FAIL', r.code === 1, `(exit ${r.code})`)
r = run({ 'sec': { kind: 'section', code: { offsetHeight: '513' }, design: { height: '512' } } })
expect('section height Δ1px → PASS', r.code === 0, `(exit ${r.code})`)

// 12. size ±1px tolerance → PASS
r = run({ 'b': { kind: 'style', code: { fontSize: '15.6px' }, design: { fontSize: '16px' } } })
expect('fontSize 15.6 vs 16 (±1px) → PASS', r.code === 0, `(exit ${r.code})`)

// 13. H-1: design prop absent from code → FAIL (not silent skip)
r = run({ 'el': { kind: 'style', code: { color: 'rgb(0,0,0)' }, design: { color: '#000000', lineHeight: '24px' } } })
expect('design prop absent from code → FAIL', r.code === 1, `(exit ${r.code})`)

// 14. H-2: borderTopLeftRadius string vs number (±1px) → PASS
r = run({ 'card': { kind: 'style', code: { borderTopLeftRadius: '8px' }, design: { borderTopLeftRadius: 8 } } })
expect('borderTopLeftRadius 8px vs 8 → PASS (px bucket)', r.code === 0, `(exit ${r.code})`)

// 15. empty code object (no missing flag) → coverage error exit 2 (no silent PASS)
r = run({ 'x': { kind: 'style', code: {}, design: { color: '#fff' } } })
expect('empty code + design present → FAIL (not-measured)', r.code === 1, `(exit ${r.code})`)
r = run({ 'x': { kind: 'style', code: {}, design: {} } })
expect('empty code + empty design → exit 2 (0 checks)', r.code === 2, `(exit ${r.code})`)

// 16. M-3: space-separated modern color syntax parses correctly
r = run({ 's': { kind: 'style', code: { color: 'rgb(228 0 43)' }, design: { color: '#E4002B' } } })
expect('space-form rgb(228 0 43) == #E4002B → PASS', r.code === 0, `(exit ${r.code})`)

console.log(`\n${failures ? '✗ ' + failures + ' self-check(s) FAILED' : '✓ all self-checks passed'}`)
process.exit(failures ? 1 : 0)
