# Primary Workflow

**IMPORTANT:** Read the skills catalog and turn on whatever skills the work in front of you calls for.
**IMPORTANT**: Spend tokens like they cost something — stay efficient without dropping quality.

#### 0. Role Injection (MANDATORY for all subagents)
Trước khi spawn bất kỳ subagent nào: tra **bảng Step → Role → Skill trong `CLAUDE.md`** (single source of truth — 10 roles), đọc `.claude/roles/{role}.md`, prepend toàn bộ nội dung vào prompt theo **lean CRAFT-X template** (Context + Task + `Output feeds →`). Role file đã chứa R·A·F·T; chỉ thêm C (state động) khi spawn. KHÔNG thêm Example trừ khi task mơ hồ.

#### 1. Plan → Validate → Build → Integrate

```
/tkm:create-plan            ← plan-architect: viết plan phases (research song song nếu cần)
        ↓
/tkm:predict-risks + review ← plan-reviewer: validate. Chưa APPROVED → KHÔNG build
        ↓
Build SONG SONG (2 track không block nhau):
  Track A  fe-developer  → /momorph-implement-design   (UI + mock data từ Figma)
  Track B  be-developer  → /tkm:takumi (BE phases)      (schema + actions + hooks)
        ↓
/tkm:takumi (integration)  ← integration-engineer: wire UI ↔ backend, thay mock = real data
```

**Rules:**
- Plan chưa APPROVED → không build (PLAN-FIRST).
- Track A ∥ Track B: không chung file, không block nhau.
- Edit file tại chỗ — không tạo bản `*-enhanced` / `*-v2`.
- **[IMPORTANT]** Compile (`tsc --noEmit`) sau mỗi file để bắt lỗi sớm.

#### 2. Testing — DEV → QA feedback loop

```
/tkm:generate-testcases   ← test-writer: generate từ MoMorph spec (TDD prep)
        ↓
/tkm:run-tests (write)    ← test-writer: viết Vitest + Playwright
        ↓
/tkm:run-tests (execute)  ← test-runner: chạy và report exact output
        ↓
    PASS? ──YES──→ Step 3 (Code Review)
        │
       NO
        ↓
FEEDBACK cụ thể → DEV agent (fe/be-developer role) fix
        ↓
/tkm:run-tests lại        ← test-runner: re-run
        ↓
    PASS? ──YES──→ Step 3
        │
       NO (lần 2)
        ↓
/tkm:debug-code           ← debug root cause trước khi fix tiếp
        ↓
DEV fix → /tkm:run-tests lần 3
        ↓
    PASS? ──YES──→ Step 3
        │
       NO (lần 3) → ESCALATE USER — không tự retry thêm
```

**Rules:**
- Max 3 vòng retry trước khi escalate user
- FEEDBACK phải cụ thể: file + line + error message — không được nói chung chung
- Không fake green: không dùng `test.skip`, `--force`, mock để bypass
- Không fix test để pass — fix code để test đúng

#### 3. Code Review — QA → DEV feedback loop

```
/tkm:review-code          ← code-reviewer: review diff
        ↓
    APPROVED? ──YES──→ Step 4 (Docs + Git)
        │
  APPROVED_WITH_CONDITIONS → DEV fix warnings → re-review (1 lần)
        │
  CHANGES_REQUIRED
        ↓
FEEDBACK cụ thể (CRITICAL findings) → DEV agent fix
        ↓
/tkm:review-code lại      ← re-review
        ↓
    APPROVED? ──YES──→ Step 4
        │
       NO (lần 2) → ESCALATE USER
```

**Rules:**
- CRITICAL findings → phải fix, không thể ship
- WARNING → fix hoặc defer với linked issue
- Max 2 vòng review. Nếu vẫn fail → escalate, không loop vô tận
- `/tkm:audit-security` chạy song song với review nếu có thay đổi auth/DB/storage

#### 4. Docs → Ship

- Doc Writer (**role: doc-writer**) → `/tkm:manage-docs` cập nhật `./docs` (+ `/tkm:audit-doc-parity` verify khớp code). Document breaking changes.
- Git Manager → `/tkm:git` (commit/push/PR, conventional commits, scan secrets).
- Deployer (**role: deployer**) → `/tkm:deploy-app` khi user yêu cầu go-live → smoke test production (login + core flow). Chưa test pass → chưa gọi là deploy xong.

#### 5. Debugging

```
Bug reported / CI fail
        ↓
/tkm:debug-code           ← diagnose root cause TRƯỚC khi fix
        ↓
DEV fix (fe/be-developer role) → /tkm:fix-bug
        ↓
/tkm:run-tests            ← test-runner verify fix
        ↓
    PASS? ──YES──→ Step 3 (Code Review)
        │
       NO → loop debug lại (max 3 lần → escalate user)
```

#### 6. Visual Explanations
When you need to make complex code, a protocol, or an architecture click:
- **When to use:** the user says "explain", "how does X work", or "visualize", or the topic has 3+ pieces interacting.
- `/tkm:preview-output --explain <topic>` for a visual explanation built from ASCII + Mermaid.
- `/tkm:preview-output --diagram <topic>` for architecture and data-flow diagrams.
- `/tkm:preview-output --slides <topic>` for step-by-step walkthroughs.
- `/tkm:preview-output --ascii <topic>` for terminal-only output.
- **HTML mode** (add `--html` for self-contained HTML pages that open straight in the browser):
  - `/tkm:preview-output --html --explain <topic>` — publication-quality HTML explanation
  - `/tkm:preview-output --html --diagram <topic>` — interactive HTML diagram with zoom controls
  - `/tkm:preview-output --html --slides <topic>` — magazine-quality slide deck
  - `/tkm:preview-output --html --diff [ref]` — visual diff review
  - `/tkm:preview-output --html --plan-review` — plan vs codebase comparison
  - `/tkm:preview-output --html --recap [timeframe]` — project context snapshot
- **Plan context:** visuals land in the plan folder named by the `## Plan Context` hook injection; with none, they go to `plans/visuals/`.
- **Markdown mode:** opens automatically in the browser via markdown-novel-viewer, Mermaid rendered.
- **HTML mode:** opens straight in the browser — self-contained, no server.
- For more on this, see `development-rules.md` → "Visual Aids".
