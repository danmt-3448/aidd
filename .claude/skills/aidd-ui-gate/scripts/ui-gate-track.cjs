#!/usr/bin/env node
/**
 * ui-gate-track.cjs — PostToolUse hook (Edit | Write | MultiEdit).
 *
 * Fires on the ACTUAL UI file write (not on prompt keywords), so the gate is
 * triggered by real UI changes regardless of how the user phrased their request.
 * Stamps uiTouchedAt into per-session state and injects a firm reminder. The Stop
 * hook (ui-gate-enforcer.cjs) later refuses to end the turn until the gate runs.
 *
 * Committed with the aidd-ui-gate skill (team-shared). Always exits 0.
 */

const { read, write, readStdin, isUiFile, isVisualEdit, routeFor } = require('./lib/ui-gate-state.cjs')

const payload = readStdin()
const sessionId = payload.session_id || payload.sessionId
const input = payload.tool_input || payload.toolInput || {}

// Edit/Write use file_path; MultiEdit may carry edits[] but shares file_path.
const filePath = input.file_path || input.path || input.filePath || ''
if (!isUiFile(filePath)) process.exit(0)

// Option A (2026-08-11): only gate edits that actually touch visual output (className/style/
// structure) — what property-diff measures. Pure text-label / copy / comment edits don't move
// the needle → don't stamp, don't treadmill the Stop gate. Conservative: anything not provably
// non-visual still stamps (whole-file Write, logic/JSX-structure changes, any className/style).
if (!isVisualEdit(input)) process.exit(0)

const state = read(sessionId)
state.uiTouchedAt = Date.now()
state.uiFiles = Array.from(new Set([...(state.uiFiles || []), filePath])).slice(-20)
write(sessionId, state)

const route = routeFor(filePath)
process.stdout.write(
  [
    '## ⚠️ UI file vừa bị sửa — UI-First Gate BẮT BUỘC trước khi kết thúc turn',
    `File: \`${filePath}\` → route \`${route}\`.`,
    'PHẢI chạy skill `/aidd-ui-gate ' + route + '` (pixel-diff ≤ 1% @ 1440+1280 + behavior checklist) TRƯỚC khi báo done.',
    'Stop sẽ bị CHẶN nếu chưa chạy gate sau lần sửa này. Chấm bằng mắt KHÔNG thay thế gate.',
    'Không chạy được gate (dev down…) → nêu lý do rõ; để bỏ qua có chủ đích: `export TKM_SKIP_UI_GATE=1`.',
  ].join('\n'),
)
process.exit(0)
