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

const payload = readStdin()
const sessionId = payload.session_id || payload.sessionId
const state = read(sessionId)

// No UI touched this session → nothing to enforce.
if (!state.uiTouchedAt) allow()

// Gate ran after the latest UI edit → satisfied.
if (state.gateRunAt && state.gateRunAt >= state.uiTouchedAt) allow()

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
  'UI-First Gate CHƯA chạy sau khi sửa UI trong session này.',
  files.length ? `File UI đã sửa: ${files.slice(-8).join(', ')}` : '',
  routes.length ? `Chạy: /aidd-ui-gate ${routes.join(' , /aidd-ui-gate ')}` : 'Chạy: /aidd-ui-gate <screen route>',
  'Yêu cầu: pixel-diff ≤ 1% @ 1440+1280 (scripts/pixel-diff.mjs) + behavior checklist, rồi báo kết quả PASS/FAIL.',
  'Không chạy được gate (dev down / lý do chính đáng) → `export TKM_SKIP_UI_GATE=1` rồi kết thúc, HOẶC tạo file .claude/hooks/.logs/ui-gate-skip (bỏ qua 1 lần).',
]
  .filter(Boolean)
  .join(' ')

process.stdout.write(JSON.stringify({ decision: 'block', reason }))
process.exit(0)
