#!/usr/bin/env node
/**
 * ui-gate-reminder.cjs — UserPromptSubmit hook.
 *
 * Deterministically nudges the agent to run /aidd-ui-gate whenever the user's
 * prompt looks like UI feedback / a UI change on a screen — so the gate is not
 * skipped just because the model forgot (triggers/description are only hints).
 *
 * Committed with the aidd-ui-gate skill (shared with the team) and registered in
 * .claude/settings.json → hooks.UserPromptSubmit. Reads the prompt from stdin
 * JSON ({ prompt }) and, on a UI-feedback match, prints a reminder to stdout
 * (Claude Code injects hook stdout as context). Always exits 0 — never blocks.
 */

let raw = ''
process.stdin.on('data', (c) => (raw += c))
process.stdin.on('end', () => {
  let prompt = ''
  try {
    const j = JSON.parse(raw)
    prompt = String(j.prompt ?? j.user_prompt ?? j.message ?? raw)
  } catch {
    prompt = raw
  }
  const p = prompt.toLowerCase()

  // UI-feedback / UI-change signals (VN + EN). Kept broad but UI-specific so it
  // fires on design feedback, not on generic prompts.
  const TERMS = [
    'ui', 'giao diện', 'figma', 'design', 'pixel', 'pixel-perfect',
    'font', 'font-weight', 'font weight', 'weight', 'size', 'màu', 'mau', 'color',
    'icon', 'button', 'nút', 'nut', 'layout', 'card', 'badge', 'shadow', 'box-shadow',
    'spotlight', 'carousel', 'header', 'banner', 'sidebar', 'footer', 'dropdown',
    'padding', 'spacing', 'overlay', 'responsive', 'breakpoint', '1440', '1280',
    'giống', 'giong', 'chưa đúng', 'chua dung', 'chưa giống', 'bị lệch', 'bi lech',
    'bị đè', 'bi de', 'đè', 'tràn', 'tran', 'cắt', 'căn', 'chỉnh lại', 'chinh lai',
    'check ui', 'kiểm ui', 'kiem ui', 'verify ui', 'chạy gate', 'chay gate', 'ui gate',
    'phòng ban', 'phong ban', 'highlight kudos', 'all kudos', 'xem chi tiết', 'copy link',
    'nhìn xuyên', 'overlap', 'align',
  ]
  // Local screen routes.
  const ROUTES = ['/board', '/profile', '/awards', '/kudos', '/secret-box', '/rules', '/todo', '/notifications', '/countdown']

  const matched = TERMS.filter((t) => p.includes(t))
  const routes = ROUTES.filter((r) => p.includes(r))
  if (matched.length === 0 && routes.length === 0) process.exit(0)

  const hit = [...new Set([...matched, ...routes])].slice(0, 6).join(', ')
  const route = routes[0] || '<screen route>'

  process.stdout.write(
    [
      '## ⚠️ UI-First Gate — BẮT BUỘC (auto-nudge)',
      `Prompt có tín hiệu feedback/thay đổi UI (khớp: ${hit}).`,
      'Nếu turn này SỬA UI bất kỳ screen nào, BẮT BUỘC chạy skill `/aidd-ui-gate ' + route + '` TRƯỚC khi báo done:',
      '- Pixel-diff ≤ 1% ở 1440 + 1280 vs ảnh Figma (script `.claude/skills/aidd-ui-gate/scripts/pixel-diff.mjs`).',
      '- Walk behavior checklist: 4 state `?ui_state=`, interactions, 0 console error.',
      'Chấm bằng mắt/screenshot thủ công KHÔNG thay thế gate. Không kết luận done khi chưa chạy gate + báo kết quả. Xem `.claude/rules/ui-first-gate.md`.',
    ].join('\n'),
  )
  process.exit(0)
})
