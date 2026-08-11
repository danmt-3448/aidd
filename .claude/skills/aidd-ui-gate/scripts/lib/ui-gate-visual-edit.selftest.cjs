#!/usr/bin/env node
/**
 * Selftest for isVisualEdit() — the option-A heuristic that lets pure text/comment
 * edits through the UI-First Gate while still gating any className/style/structure change.
 * Run: node .claude/skills/aidd-ui-gate/scripts/lib/ui-gate-visual-edit.selftest.cjs
 * Exit 0 = all pass, 1 = any fail.
 */
const { isVisualEdit } = require('./ui-gate-state.cjs')

const cases = [
  ['label text change (quoted prop) → skip', { old_string: 'label="Số tim bạn nhận được:"', new_string: 'label="Số tim đạt được:"' }, false],
  ['className change → GATE', { old_string: 'className="flex gap-4"', new_string: 'className="flex gap-8"' }, true],
  ['style= change → GATE', { old_string: 'style={{ padding: 4 }}', new_string: 'style={{ padding: 8 }}' }, true],
  ['comment-only → skip', { old_string: '{/* Row 3: cũ */}', new_string: '{/* Row 3: mới */}' }, false],
  ['aria-label text → skip', { old_string: 'aria-label="a"', new_string: 'aria-label="b"' }, false],
  ['logic add (useState) → GATE', { old_string: 'const x = 1', new_string: 'const [x,setX] = useState(1)' }, true],
  ['JSX structure add div → GATE', { old_string: '<span>{v}</span>', new_string: '<div><span>{v}</span></div>' }, true],
  ['Write whole file → GATE', { content: 'whatever' }, true],
  ['MultiEdit text+className → GATE', { edits: [{ old_string: 'label="a"', new_string: 'label="b"' }, { old_string: 'className="a"', new_string: 'className="b"' }] }, true],
  ['MultiEdit both text → skip', { edits: [{ old_string: 'label="a"', new_string: 'label="b"' }, { old_string: 'title="x"', new_string: 'title="y"' }] }, false],
  ['remove className (old has it) → GATE', { old_string: '<div className="p-2">', new_string: '<div>' }, true],
]

let pass = 0
let fail = 0
for (const [name, input, want] of cases) {
  const got = isVisualEdit(input)
  const ok = got === want
  console.log((ok ? '✓' : '✗ FAIL'), name, '→ got', got, 'want', want)
  ok ? pass++ : fail++
}
console.log(`\n${pass} pass, ${fail} fail`)
process.exit(fail ? 1 : 0)
