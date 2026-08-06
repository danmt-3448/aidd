#!/usr/bin/env node
/**
 * ui-gate-enforcer.cjs — Stop hook.
 *
 * Refuses to end the turn when a UI file was edited this session but /aidd-ui-gate
 * has NOT run since that edit. This is the hard enforcement the soft nudge lacked:
 * a hook cannot call a skill, but it CAN block Stop until the agent runs the gate.
 *
 * Clears cleanly when gateRunAt >= uiTouchedAt (gate ran after the last UI change).
 * Escape hatches (avoid trapping a session that genuinely can't gate):
 *   - env TKM_SKIP_UI_GATE=1
 *   - one-shot sentinel file .claude/hooks/.logs/ui-gate-skip (consumed on use)
 *
 * Non-UI sessions are never affected (no uiTouchedAt → passes silently).
 * Committed with the aidd-ui-gate skill (team-shared). Exits 0 always; blocking is
 * signalled via {"decision":"block","reason":...} on stdout.
 */

const fs = require('fs')
const path = require('path')
const { read, readStdin, stateDir, routeFor } = require('./lib/ui-gate-state.cjs')

function allow() {
  process.exit(0)
}

/**
 * RT-4: the gate is only satisfied by a real PASS verdict AFTER the last UI edit —
 * not merely by the skill being invoked. Scan the ui-gate reports and accept only a
 * report modified since `sinceMs` whose body records a PASS verdict (BLOCKED/FAIL do
 * NOT clear). Report location + "## Verdict: PASS" format come from SKILL.md Step 5.
 */
/** Route → filename slug, e.g. "/awards" → "awards", "(feature: board)" → "board". */
function slugOf(route) {
  const s = String(route || '')
  // "(feature: board)" → "board" (routeFor labels feature files this way; without this
  // the slug would collapse to "feature" and a per-screen PASS report would never match).
  const feat = s.match(/feature:\s*([a-z0-9-]+)/i)
  if (feat) return feat[1].toLowerCase()
  const m = s.match(/[a-z0-9][a-z0-9-]*/i)
  return m ? m[0].toLowerCase() : ''
}

function hasPassingReportSince(sinceMs, touchedSlugs) {
  const dir = path.join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), 'plans', 'reports')
  let files
  try {
    files = fs.readdirSync(dir)
  } catch {
    return false
  }
  for (const f of files) {
    if (!/^ui-gate-.*\.md$/.test(f)) continue
    // H-3: if we know which screen(s) were touched, a PASS report only counts when its
    // filename names one of them — a /profile PASS must not clear a /awards edit.
    if (touchedSlugs.length && !touchedSlugs.some((s) => f.toLowerCase().includes(s))) continue
    const p = path.join(dir, f)
    let st
    try {
      st = fs.statSync(p)
    } catch {
      continue
    }
    if (st.mtimeMs < sinceMs) continue
    let body = ''
    try {
      body = fs.readFileSync(p, 'utf8')
    } catch {
      continue
    }
    // C-1/C-2: require a standalone `## Verdict: PASS` line (end-of-line, no `| FAIL | BLOCKED`
    // template alternatives), and reject if the report also records FAIL/BLOCKED anywhere.
    if (/^\s*##\s*Verdict:\s*PASS\s*$/im.test(body) && !/Verdict:\s*(FAIL|BLOCKED)\b/i.test(body)) {
      return true
    }
  }
  return false
}

const payload = readStdin()
const sessionId = payload.session_id || payload.sessionId
const state = read(sessionId)

// No UI touched this session → nothing to enforce.
if (!state.uiTouchedAt) allow()

// Satisfied only by a PASS-verdict gate report — for one of the touched screens — written after
// the last UI edit (RT-4 + H-3). gateRunAt alone (merely invoking the skill) no longer clears.
const touchedSlugs = Array.from(new Set((state.uiFiles || []).map((f) => slugOf(routeFor(f))).filter(Boolean)))
if (hasPassingReportSince(state.uiTouchedAt, touchedSlugs)) allow()

// Escape hatch 1: env override.
if (process.env.TKM_SKIP_UI_GATE && process.env.TKM_SKIP_UI_GATE !== '0') allow()

// Escape hatch 2: one-shot sentinel file (consumed).
const sentinel = path.join(stateDir(), 'ui-gate-skip')
if (fs.existsSync(sentinel)) {
  try {
    fs.unlinkSync(sentinel)
  } catch {
    /* ignore */
  }
  allow()
}

// Block finishing — instruct running the gate on the touched routes.
const files = state.uiFiles || []
const routes = Array.from(new Set(files.map(routeFor))).slice(0, 5)
const reason = [
  'UI-First Gate chưa có verdict PASS sau khi sửa UI trong session này.',
  files.length ? `File UI đã sửa: ${files.slice(-8).join(', ')}` : '',
  routes.length ? `Chạy: /aidd-ui-gate ${routes.join(' , /aidd-ui-gate ')}` : 'Chạy: /aidd-ui-gate <screen route>',
  'Yêu cầu: property-diff (style-assert.mjs) exit 0 @ 1440+1280 + nets + behavior checklist → report ghi "Verdict: PASS". Run FAIL/BLOCKED KHÔNG mở được Stop.',
  'Không chạy được gate (dev down / lý do chính đáng) → `export TKM_SKIP_UI_GATE=1` rồi kết thúc, HOẶC tạo file .claude/hooks/.logs/ui-gate-skip (bỏ qua 1 lần).',
]
  .filter(Boolean)
  .join(' ')

process.stdout.write(JSON.stringify({ decision: 'block', reason }))
process.exit(0)
