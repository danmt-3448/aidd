/**
 * ui-gate-state.cjs — shared state for the UI-First Gate enforcement hooks.
 *
 * Three hooks cooperate through one per-session JSON file:
 *   - ui-gate-track.cjs   (PostToolUse Edit|Write|MultiEdit) → stamps uiTouchedAt when a UI file is written
 *   - ui-gate-mark-run.cjs (PreToolUse Skill)                → stamps gateRunAt when /aidd-ui-gate is invoked
 *   - ui-gate-enforcer.cjs (Stop)                            → blocks finishing if uiTouchedAt > gateRunAt
 *
 * State is keyed by session_id so unrelated sessions never block each other.
 * Path: <project>/.claude/hooks/.logs/ui-gate-<session>.json
 */

const fs = require('fs')
const path = require('path')

function projectDir() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd()
}

function stateDir() {
  const d = path.join(projectDir(), '.claude', 'hooks', '.logs')
  try {
    fs.mkdirSync(d, { recursive: true })
  } catch {
    /* ignore */
  }
  return d
}

function statePath(sessionId) {
  const id = String(sessionId || 'default').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80)
  return path.join(stateDir(), `ui-gate-${id}.json`)
}

function read(sessionId) {
  try {
    return JSON.parse(fs.readFileSync(statePath(sessionId), 'utf8'))
  } catch {
    return { uiTouchedAt: 0, gateRunAt: 0, uiFiles: [] }
  }
}

function write(sessionId, state) {
  try {
    fs.writeFileSync(statePath(sessionId), JSON.stringify(state, null, 2))
  } catch {
    /* best-effort */
  }
}

/** Read a hook stdin JSON payload. Returns {} on any failure. */
function readStdin() {
  try {
    const raw = fs.readFileSync(0, 'utf8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

/** Is this a UI file whose visual output the gate cares about? (.tsx/.jsx/.css under src, no tests). */
function isUiFile(filePath) {
  if (!filePath) return false
  const rel = String(filePath).replace(/\\/g, '/')
  if (!/\/src\//.test(rel)) return false
  if (/\.(test|spec)\.[jt]sx?$/.test(rel)) return false
  if (/\.stories\.[jt]sx?$/.test(rel)) return false
  return /\.(tsx|jsx|css)$/.test(rel)
}

const STYLE_TOKEN_RE = /(className|class\s*=|style\s*=|style\s*:)/

/** Blank out string-literal CONTENTS + comments → leaves only structure/logic/JSX-tags. */
function skeleton(s) {
  return String(s || '')
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '') // JSX comments {/* ... */}
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
    .replace(/\/\/[^\n]*/g, '') // line comments
    .replace(/"(?:[^"\\]|\\.)*"/g, '""') // double-quoted contents
    .replace(/'(?:[^'\\]|\\.)*'/g, "''") // single-quoted contents
    .replace(/`(?:[^`\\]|\\.)*`/g, '``') // template-literal contents
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Does this edit actually touch VISUAL output (styles/layout/structure), i.e. something the
 * property-diff gate measures? Conservative: returns TRUE (gate) unless the change is PROVABLY
 * non-visual. Non-visual = only string-literal text / comments changed, with NO className|style
 * token involved and NO structural (skeleton) change. This lets pure text-label / copy / comment
 * edits through without a full visual re-gate, while still gating any className/style/JSX change.
 * Whole-file Write or unknown shape → TRUE (cannot diff → conservative). [option A, 2026-08-11]
 */
function isVisualEdit(input) {
  input = input || {}
  const edits = Array.isArray(input.edits)
    ? input.edits
    : input.old_string != null || input.new_string != null
      ? [{ old_string: input.old_string, new_string: input.new_string }]
      : null
  if (!edits || edits.length === 0) return true // Write/content or unknown → can't diff → visual
  for (const e of edits) {
    const o = e.old_string || ''
    const n = e.new_string || ''
    if (STYLE_TOKEN_RE.test(o) || STYLE_TOKEN_RE.test(n)) return true // className/style involved
    if (skeleton(o) !== skeleton(n)) return true // structural/logic change outside strings+comments
  }
  return false // only text-literal / comment content changed, no style/structure → non-visual
}

/** Best-effort route guess from a UI file path, for the reminder text. */
function routeFor(filePath) {
  const rel = String(filePath || '').replace(/\\/g, '/')
  const appMatch = rel.match(/\/src\/app\/([^/]+)\//)
  if (appMatch && appMatch[1] !== '(home)') return `/${appMatch[1]}`
  if (/\/src\/app\/page\.tsx$/.test(rel)) return '/'
  const featMatch = rel.match(/\/src\/features\/([^/]+)\//)
  if (featMatch) return `(feature: ${featMatch[1]})`
  return '<screen route>'
}

module.exports = { read, write, readStdin, isUiFile, isVisualEdit, skeleton, routeFor, statePath, stateDir }
