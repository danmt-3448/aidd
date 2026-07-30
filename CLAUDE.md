# AIDD — SAA 2025 Internal

Next.js app generated from Figma design + MoMorph screen specs, using the Takumi Agent Kit.

- **Figma:** SAA 2025 - Internal Live Coding (`fileKey: 9ypp4enmFmdK3YAFJLIu6C`)
- **MoMorph:** screen specs are the source of truth for logic; Figma is the source of truth for UI.
- **Source URL shape:** `https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/{screenId}`

## ⛔ BẮT BUỘC: mọi code phải đi qua Takumi skill

**PLAN-FIRST — KHÔNG gen BẤT CỨ code nào khi chưa có plan được duyệt.** Luôn `/tkm:create-plan` (hoặc dừng ở Blueprint rest point của `/tkm:takumi` interactive) để user review + duyệt TRƯỚC khi forge. Không plan, không code.

**KHÔNG tự gen/sửa code feature ad-hoc.** Mọi thay đổi code sản phẩm PHẢI đi qua skill Takumi phù hợp:

| Việc | Skill bắt buộc |
|---|---|
| Implement 1 màn (UI + logic) | `/tkm:takumi <MoMorph URL>` |
| Nhiều màn / feature phức tạp | `/tkm:create-plan` → `/tkm:takumi <plan>` |
| Chỉ UI từ design | `/momorph-implement-design <MoMorph URL>` |
| Sửa bug 1 màn | `/tkm:fix-bug <mô tả> <MoMorph URL>` |
| Test / review / dọn code | `/tkm:run-tests`, `/tkm:review-code`, `/tkm:clean-code` |

Quy tắc: Takumi tự điều phối `implementer`/`tester`/`reviewer` subagent — **không được bỏ qua test/review** (0 lần gọi Task = chưa xong). Chỉ sửa tay khi user nói rõ ("just code it" / "sửa nhanh dòng X"). Ngoài ra: skill trước, code sau.

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
npm run dev     # dev server (http://localhost:3000)
npm run build   # production build
npm run lint    # eslint
# add: npm run test (vitest), npm run test:e2e (playwright) when tests land
```
