# AIDD — SAA 2025 Internal

Next.js app generated from Figma design + MoMorph screen specs, using the Takumi Agent Kit.

- **Figma:** SAA 2025 - Internal Live Coding (`fileKey: 9ypp4enmFmdK3YAFJLIu6C`)
- **MoMorph:** screen specs are the source of truth for logic; Figma is the source of truth for UI.
- **Source URL shape:** `https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/{screenId}`

## ⛔ BẮT BUỘC: mọi code phải đi qua Takumi skill

**PLAN-FIRST — KHÔNG gen BẤT CỨ code nào khi chưa có plan được duyệt.** Luôn `/tkm:create-plan` (hoặc dừng ở Blueprint rest point của `/tkm:takumi` interactive) để user review + duyệt TRƯỚC khi forge. Không plan, không code.

**KHÔNG tự gen/sửa code feature ad-hoc.** Mọi thay đổi code sản phẩm PHẢI đi qua skill + role đúng theo bảng sau:

## Step → Role → Skill (BẮT BUỘC)

| Step | Role (`~/.claude/agents/roles/`) | Skill | subagent_type |
|---|---|---|---|
| Check tiến độ / next step | — | `/check-progress` | orchestrator |
| Scan codebase | — | `/tkm:scan-codebase` | Explore |
| Research kỹ thuật | — | `/tkm:research` | researcher |
| Đánh giá risk trước khi build | `plan-reviewer.md` | `/tkm:predict-risks` | reviewer |
| Tạo plan | `plan-architect.md` | `/tkm:create-plan` | planner |
| Review & validate plan | `plan-reviewer.md` | `/tkm:review-code` | reviewer |
| Generate UI specs từ design | `plan-architect.md` | `/tkm:generate-ui-specs` | implementer |
| Generate test cases từ spec (TDD prep) | `test-writer.md` | `/tkm:generate-testcases` | implementer |
| Track A — UI build | `fe-developer.md` | `/momorph-implement-design <URL>` | implementer |
| Track B — Backend build | `be-developer.md` | `/tkm:takumi` (BE phases) | implementer |
| Implement màn (UI + logic full) | `fe-developer.md` + `be-developer.md` | `/tkm:takumi <URL>` | implementer ×2 |
| Multi-screen / phức tạp | `fe-developer.md` + `be-developer.md` | `/tkm:create-plan` → `/tkm:takumi <plan>` | implementer ×N |
| Design / refine DB schema | `be-developer.md` | `/tkm:design-database` | implementer |
| Integration (wire UI ↔ backend) | `integration-engineer.md` | `/tkm:takumi` (integration phase) | implementer |
| Fix bug | `fe-developer.md` hoặc `be-developer.md` | `/tkm:fix-bug <mô tả> <URL>` | implementer |
| Debug issue (diagnose trước fix) | `fe/be/integration-engineer.md` | `/tkm:debug-code` | debugger |
| Dọn code (sau feature) | `fe-developer.md` hoặc `be-developer.md` | `/tkm:clean-code` | code-simplifier |
| Viết tests | `test-writer.md` | `/tkm:run-tests` | implementer |
| Chạy tests | `test-runner.md` | `/tkm:run-tests` | tester |
| Review code | `code-reviewer.md` | `/tkm:review-code` | reviewer |
| Security audit | `code-reviewer.md` | `/tkm:audit-security` | reviewer |
| Update docs sau feature | `doc-writer.md` | `/tkm:manage-docs` | implementer |
| Audit doc vs code parity | `doc-writer.md` | `/tkm:audit-doc-parity` | reviewer |
| Deploy lên production | `deployer.md` | `/tkm:deploy-app` | deployer |
| Commit / Push / PR | — | `/tkm:git` | git-manager |

**Role injection — prompt format bắt buộc khi spawn subagent (lean CRAFT-X):**
```
{toàn bộ nội dung role file từ ~/.claude/agents/roles/}   ← R·A·F·T đã có trong role file

---

## Context                                    ← C: state động, vốn phải truyền
- Project: AIDD (Next.js + Supabase) · Branch: {branch}
- State: {phase đang làm · cái gì đã xong · file liên quan}
- Constraints: {constraint riêng task, nếu có}

## Task                                       ← A
{phase file / task description}

## Output feeds → {agent/step tiếp theo dùng output}   ← T: 1 dòng

Work context: /Users/mai.thanh.dan/Desktop/Sun/AI/aidd
Reports: /Users/mai.thanh.dan/Desktop/Sun/AI/aidd/plans/reports/
Plans: /Users/mai.thanh.dan/Desktop/Sun/AI/aidd/plans/
```
> **R·A·F** đã nằm trong role file. **C** (Context) là state động vốn phải truyền — chỉ đặt tên cho có cấu trúc. **T** (Output feeds) = 1 dòng, mỗi role đã ghi sẵn consumer mặc định ở mục Output. **X** (Example) KHÔNG thêm — role file đã có code pattern; chỉ thêm ad-hoc khi task thực sự mơ hồ.

Quy tắc: **skill trước, code sau** — không code ad-hoc. Takumi điều phối subagents — không bỏ qua test/review. Chỉ sửa tay khi user nói rõ ("just code it" / "sửa nhanh dòng X").

**BẮT BUỘC chạy `/check-progress` khi user hỏi bất kỳ dạng nào của:** "tiếp theo làm gì", "làm màn nào tiếp", "còn gì chưa xong", "check tiến độ", "what's next", "what should we do next", hoặc hỏi về trạng thái công việc chung của project.

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) + React + TypeScript |
| Styling | Tailwind CSS |
| UI components | shadcn/ui (Radix-based, copy-in) |
| i18n | next-intl (VN/EN, cookie `NEXT_LOCALE`) |
| Rich-text editor | Tiptap (Viết Kudo: bold/italic/link/quote + @mention → HTML) |
| Data fetching | TanStack Query (server state) |
| Client state | Zustand |
| Backend / Auth | Supabase (local project) |
| Unit tests | Vitest |
| E2E tests | Playwright |

> Only `next`, `react`, `react-dom` are installed today. Add the packages above **when a screen first needs them** — do not pre-install everything. Keep `package.json` honest.

## Directory Conventions

- Path alias: `@/*` → `./src/*`
- `src/app/**` — routes (App Router). One folder per route segment.
- `src/components/ui/**` — shadcn/ui primitives.
- `src/components/**` — shared app components.
- `src/features/{feature}/**` — feature-scoped components, hooks, stores.
- `src/lib/**` — utilities, Supabase client, query client setup.
- `src/stores/**` — Zustand stores (or colocate under `features/`).
- Tests live next to source (`*.test.ts(x)`) for unit; `e2e/**` for Playwright.

## Code Conventions

- Files in **kebab-case**; self-describing names.
- Keep each file **under 200 lines** — split into single-purpose modules/components.
- Composition over inheritance; pull utilities and business logic into their own modules.
- Follow **YAGNI / KISS / DRY**.
- Edit files in place — never create `*-enhanced` / `*-v2` copies.
- Write real implementations, never stubs.

## UI Fidelity: bám Figma + responsive (BẮT BUỘC)

- **Pixel-perfect với Figma** — KHÔNG đoán giá trị visual (màu/spacing/size/font); lấy qua MoMorph MCP. Chạy visual-diff loop (Playwright vs Figma reference) tới khi khớp.
- **Responsive default-on** — mọi màn phải adapt theo viewport, dùng breakpoint **Tailwind mặc định**: `sm 640 · md 768 · lg 1024 · xl 1280`. Mobile-first. Test ở **375 / 768 / 1280px**.
- Design là artboard **desktop** → pixel-perfect ở size desktop; size khác adapt hợp lý (`clamp()` cho font lớn, stack cột, `width:100%` cho media). Màn nào có artboard mobile riêng → khớp luôn.
- Không hardcode `width/height` cố định cho element rộng > 50% viewport.

## Gen-Code Workflow (MoMorph → code)

Match the scenario to the task (see the hands-on README):

1. **Simple/medium feature** → `/tkm:takumi <MoMorph Screen URLs>`
2. **Complex feature (multi-screen)** → `/tkm:create-plan <URLs>` → review → `/tkm:takumi plans/.../plan.md`
3. **UI only from design** → `/momorph-implement-design <MoMorph Screen URLs>`
4. **Fix a bug on a screen** → `/tkm:fix-bug <description> <MoMorph Screen URL>`

Rules: **never guess visual values** — MCP design data is authoritative. Fetch spec + test cases, resolve gaps via clarification, then build. UI (Track A) and backend/logic (Track B) run in parallel.

## Testing (TDD)

- Write tests first, driven by the MoMorph **test cases** for the screen.
- **Unit (Vitest):** component logic, hooks, stores, utils, validation.
- **E2E (Playwright):** user flows per the screen spec (auth, navigation, form submit, error states).
- Do **not** wave through failing tests or fake a green build. Fix, then re-run.

## Definition of Done

- **UI:** pixel-accurate to the Figma design.
- **Logic:** behaves exactly per the MoMorph screen spec.
- **Quality:** Unit + E2E tests present and passing, built TDD-style.
- Reviewer agent runs after implementation.

## Commands

```bash
npm run dev        # dev server (http://localhost:3000)
npm run build      # production build
npm run lint       # eslint
npm run test       # unit (vitest)
npm run test:e2e   # e2e (playwright) — cần dev server + Supabase local
npm run seed:auth  # seed users qua GoTrue admin API (auth.admin.createUser)
npm run db:reset   # supabase db reset + seed:auth (schema + hashtags + users)
```

> Seed users KHÔNG tạo bằng SQL thô (INSERT auth.users để NULL token → vỡ login).
> Dùng `supabase/seed-auth-users.mjs` qua admin API → native GoTrue accounts.

## Local setup (teammate onboarding)

**MCP servers** — template committed ở `.mcp.example.json`. Onboard bằng cách copy sang `.mcp.json` (đã gitignore, local-only) rồi điền token:
```bash
cp .mcp.example.json .mcp.json   # Claude Code tự nạp .mcp.json khi mở project
```

- **momorph** (`https://mcp.momorph.ai/mcp`) — cần env var `MOMORPH_GITHUB_TOKEN` (GitHub token gắn với momorph auth của **chính bạn**, per-user). `.mcp.json` expand `${MOMORPH_GITHUB_TOKEN}` từ **shell environment** của tiến trình chạy Claude Code — export trước khi mở:
  ```bash
  export MOMORPH_GITHUB_TOKEN="<your-momorph-github-token>"   # token riêng của bạn, KHÔNG commit
  ```
  (Không đặt trong `.env.local` — file đó chỉ feed Next.js runtime, không feed MCP header.)
- **playwright** — `npx @playwright/mcp@latest`, không cần secret.

> ⛔ `.mcp.json` đã gitignore (có thể chứa token thật). Chỉ commit `.mcp.example.json` với placeholder — KHÔNG bao giờ commit token thật.

**Takumi kit (skills / agents / roles / commands)** — KHÔNG vendor vào repo (`.gitignore` chặn `.claude/*` trừ `rules/` + `settings.json`). Kit sống ở global. Teammate onboarding — chạy **một lần**:
```bash
tkm init --kit extras   # cài skills + agents + roles (gồm ~/.claude/agents/roles/) + momorph-implement-design
```
> Chỉ `.claude/rules/`, `.claude/settings.json`, `CLAUDE.md`, `.mcp.example.json` là committed (project-specific). Mọi thứ khác đến từ kit global — vì vậy `tkm init` là bước bắt buộc trước khi chạy workflow.
