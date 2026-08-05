#!/usr/bin/env node
/**
 * ui-gate-mark-run.cjs — PreToolUse hook (Skill).
 *
 * When the agent invokes the `aidd-ui-gate` skill, stamp gateRunAt so the Stop
 * enforcer knows the gate was run after the latest UI edit. Never blocks the Skill
 * call — purely records. Committed with the aidd-ui-gate skill. Always exits 0.
 */

const { read, write, readStdin } = require('./lib/ui-gate-state.cjs')

const payload = readStdin()
const sessionId = payload.session_id || payload.sessionId
const input = payload.tool_input || payload.toolInput || {}
const skill = String(input.skill || input.name || input.skill_name || '')

if (/aidd-ui-gate/.test(skill)) {
  const state = read(sessionId)
  state.gateRunAt = Date.now()
  write(sessionId, state)
}
process.exit(0)
