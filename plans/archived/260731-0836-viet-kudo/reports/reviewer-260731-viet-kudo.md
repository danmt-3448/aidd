# Code Review — Viết Kudo Feature

**Date:** 2026-07-31
**Scope:** Backend (migration, RPC, seed), Server Actions, Client Hooks, UI Components
**Verdict:** APPROVE-WITH-FIXES

---

## Must-Fix Before Merge

1. **[CRITICAL] Seed hashtag UUIDs fail `hashtagIdsSchema` validation — every real submit broken**
2. **[HIGH] Storage DELETE policy missing — orphan cleanup on cancel silently fails**
3. **[HIGH] `window.prompt` link URL accepted without scheme validation at Tiptap level**
4. **[HIGH] Raw DB error messages returned to client (internal RPC error strings exposed)**
5. **[MEDIUM] `userId` race: image upload possible before auth resolves → Storage path starts with `//`**

---

## Critical

### C1 — Seed hashtag UUIDs fail `hashtagIdsSchema` v4 regex; all kudo submits broken in dev

**File:** `supabase/seed.sql:108–122` + `src/features/kudos/kudo-schema.ts:47`

`seed.sql` inserts hashtags with UUIDs like `aaaaaaaa-0000-0000-0000-000000000001`. The third group is `0000`, but `hashtagIdsSchema` applies `UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-…/` which requires the third group to start with `4`. These UUIDs fail that regex.

**Reproduction path:**
1. `supabase db reset` applies seed
2. User opens modal → `listHashtags()` returns `aaaaaaaa-0000-…` IDs
3. User selects hashtags → `hashtagIds: ['aaaaaaaa-0000-0000-0000-000000000001', …]`
4. `createKudo(input)` runs `createKudoSchema.safeParse(input)` → fails with `"hashtagId must be a valid UUID v4"` on every submit

The 62 unit tests and 8 DB integration tests both pass because the unit tests use hardcoded valid v4 UUIDs (`550e8400-e29b-41d4-…`) and the integration tests bypass the server action schema entirely (direct SQL as superuser).

**Fix:** Either loosen the regex to accept any RFC 4122 UUID variant (drop the `4` and `[89ab]` requirements, use `[0-9a-f]{4}` for both), or regenerate seed UUIDs with proper v4 values. The simpler fix is to drop version-specific enforcement since Postgres `gen_random_uuid()` generates v4 but test/seed data may not. There is no security value in enforcing v4 vs v1 on hashtag IDs from the catalog.

```typescript
// kudo-schema.ts — replace UUID_REGEX
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
```

---

## High

### H1 — Storage DELETE policy missing; cancel/remove cleanup silently fails for all users

**File:** `supabase/migrations/20260731000000_create_kudos.sql` (Storage policies section, after line 131)

The migration creates INSERT and SELECT policies on `storage.objects` for `kudo-images` bucket, but no DELETE policy. Supabase Storage RLS denies all operations without an explicit policy. Confirmed via:

```sql
SELECT polname, polcmd FROM pg_policy WHERE polrelid = 'storage.objects'::regclass AND polname LIKE 'kudo%';
-- Returns: kudo_images_storage_insert (INSERT), kudo_images_storage_select (SELECT)
-- No DELETE row exists.
```

**Impact:** `handleRemoveImage` and `handleCancel` call `supabase.storage.from(BUCKET).remove([path])`. These calls return a 403 error silently (the error is not surfaced to the user; see `kudo-compose-modal.tsx:128`). Every upload that the user "removes" before submitting remains as a permanent orphan in Storage. Cancel discards the form but leaves all uploaded images behind.

**Fix:** Add a DELETE policy restricting deletion to the uploader's own folder:

```sql
create policy "kudo_images_storage_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'kudo-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

### H2 — `window.prompt` for link URL accepts `javascript:` and `data:` schemes at the Tiptap level

**File:** `src/features/kudos/components/tiptap-editor.tsx:160`

```typescript
const url = window.prompt('URL:', prev ?? 'https://')
if (url === null) return
if (url === '') { editor.chain().focus().unsetLink().run(); return }
editor.chain().focus().setLink({ href: url }).run()
```

The `Link.configure` in this file does not set `protocols` or `autolink: false`, so Tiptap accepts any scheme including `javascript:`. The stored content is sanitized by `sanitize-html` server-side (which has `allowedSchemes: ['https', 'http', 'mailto']`), so the DB never stores `javascript:` hrefs. However, the editor renders the `javascript:` href *locally* in the Tiptap ProseMirror view between the time the user sets it and the time it's submitted. With `openOnClick: false`, the link isn't clickable in the editor, so actual XSS execution in the editor context is prevented — but it's a narrow margin. More importantly, if the application ever renders `contentHtml` from the client state (e.g. a preview) without re-sanitizing, XSS is live.

**Fix:** Add client-side URL validation before calling `setLink`:

```typescript
case 'link': {
  const prev = editor.getAttributes('link').href as string | undefined
  const url = window.prompt('URL:', prev ?? 'https://')
  if (url === null) return
  if (url === '') { editor.chain().focus().unsetLink().run(); return }
  // Reject non-http(s)/mailto schemes before storing in editor state
  try {
    const parsed = new URL(url)
    if (!['https:', 'http:', 'mailto:'].includes(parsed.protocol)) return
  } catch { return }
  editor.chain().focus().setLink({ href: url }).run()
  break
}
```

### H3 — Raw DB/RPC error messages leaked to the client via `_root` error key

**File:** `src/features/kudos/kudo-actions.ts:116`

```typescript
if (error) {
  console.error('[createKudo] RPC error', error.message)
  return {
    ok: false,
    errors: { _root: [error.message] },  // ← leaks verbatim Postgres error
  }
}
```

`error.message` is the raw Supabase/PostgREST error string, which includes Postgres internals on unexpected failures (e.g. FK violation message: `"insert or update on table "kudos" violates foreign key constraint "kudos_receiver_id_fkey""`, or PK collision details). These strings reach the browser via `rootError` in `use-create-kudo.ts:55` and are rendered directly in the modal. This leaks table structure and constraint names to any authenticated user who can trigger an error path.

The custom RPC error messages (`"Sender and receiver must differ"`) are acceptable to show; the issue is raw Postgres internal errors on unexpected paths.

**Fix:** Map known RPC errorcodes to friendly messages; catch-all to a generic string:

```typescript
function friendlyRpcError(message: string): string {
  if (message.includes('P0001')) return 'Bạn cần đăng nhập để gửi Kudo'
  if (message.includes('P0002')) return 'Không thể gửi Kudo cho chính mình'
  if (message.includes('P0003') || message.includes('P0004')) return 'Hashtag không hợp lệ'
  if (message.includes('P0005')) return 'Tối đa 5 ảnh'
  return 'Đã xảy ra lỗi. Vui lòng thử lại.'
}
```

---

## Medium

### M1 — `userId` race: upload possible before auth resolves; storage path becomes `//kudoId/filename`

**File:** `src/features/kudos/components/kudo-compose-modal.tsx:31–34`

```typescript
const [userId, setUserId] = useState<string>('')
useEffect(() => {
  createClient().auth.getUser().then(({ data }) => {
    if (data.user) setUserId(data.user.id)
  })
}, [])
```

`userId` starts as `''`. If the user clicks the image add button before the `getUser()` promise resolves (possible on slow networks or immediately after SSR hydration), the storage path becomes `/${kudoId}/filename` (empty first segment). The Storage INSERT policy checks `(storage.foldername(name))[1] = auth.uid()::text`, so the upload fails with a 403 — but the error is shown to the user as `"Tải ảnh thất bại: ..."`. The storage path `''/{kudoId}/filename` also doesn't match any user folder, leaving a potential orphan in the `root` folder if the policy ever changes.

**Fix:** Disable the ImageUploader's add button until `userId` is non-empty:

```typescript
// In ImageUploader, add a prop: disabled?: boolean
// In kudo-compose-modal.tsx, pass:
<ImageUploader
  ...
  disabled={!userId}  // block upload until auth resolves
/>
```

### M2 — Duplicate `kudoId` on retry after RPC failure causes permanent 500 error for that session

**File:** `src/features/kudos/components/kudo-compose-modal.tsx:27` + `src/features/kudos/hooks/use-create-kudo.ts`

`kudoId` is generated once via `useState(() => crypto.randomUUID())` and is stable for the entire modal session. If the RPC `create_kudo` fails for any reason after the `kudos` row is inserted (e.g. mid-transaction failure — not possible in the current implementation since it's one transaction, but consider network errors that cause client-side timeout while the DB committed), the user would retry with the same `kudoId`. The PK constraint would reject it with a duplicate-key error, resulting in a permanent failure loop until the modal is closed and reopened.

More concretely: if the RPC returns an error (not a partial commit — this is atomic), `mutation.reset()` is not called automatically on the hook level. The user sees the error, can edit content, and retries — same `kudoId` works correctly because the previous attempt rolled back. This is actually fine in the current implementation since the RPC is atomic. However, if the client ever receives a timeout while the DB committed (split-brain), retry with the same `kudoId` will fail permanently.

**Low-risk mitigation:** Generate a new `kudoId` on submission rather than at mount, or regenerate on failure. This is a medium concern, not critical, given atomicity.

### M3 — `kudo_images.storage_path` not validated against sender's UID prefix in RPC or RLS

**File:** `supabase/migrations/20260731000000_create_kudos.sql:91–100` (kudo_images INSERT policy)

The `kudo_images_insert_via_owned_kudo` policy checks that the kudo exists and belongs to `auth.uid()`, but does NOT validate that `storage_path` starts with `{auth.uid()}/`. Similarly, the `create_kudo` RPC has no path prefix check. This means:

- User A uploads file to `user-a-id/kudoId-a/img.jpg`
- User A crafts a direct API call to `create_kudo` passing `p_image_paths = ['user-b-id/kudoId-b/img.jpg']`
- The insert succeeds; kudo row now references user B's Storage path

Impact is limited: Storage SELECT policy allows any authenticated user to read any kudo image, so there's no private-image-exposure escalation. It does allow "image hijacking" where attacker references another user's image in their kudo. This is possible only via direct API call (bypassing the UI), requires knowing a valid storage path, and the content is not sensitive (kudo images are semi-public). Medium severity.

**Fix in RPC:**

```sql
-- After step 5, add:
if v_img_count > 0 then
  if exists (
    select 1 from unnest(p_image_paths) as t(path)
    where split_part(t.path, '/', 1) <> v_sender_id::text
  ) then
    raise exception 'image_paths must be under caller uid folder' using errcode = 'P0006';
  end if;
end if;
```

### M4 — Anonymous sender fully exposed to all authenticated users via SELECT policy

**File:** `supabase/migrations/20260731000000_create_kudos.sql:69–71`

The `kudos_select_authenticated` policy returns `using (true)` — all columns including `sender_id` are readable by any authenticated user. The clarification says `sender_id` is stored for audit but hidden from receiver. This "hiding" is implied to happen at the application layer (board/profile screen, not yet built). There is no column-level security, no view masking `sender_id` when `is_anonymous = true`.

This is not a v1 defect since the read screens are out of scope, but it must be addressed before any kudo-reading surface ships. Document it as a pre-condition for the board/profile plan:

- Either implement a `security definer` view that masks `sender_id` when `is_anonymous = true` for non-admin roles.
- Or handle masking in every query on the read screens with a `CASE WHEN is_anonymous THEN NULL ELSE sender_id END` pattern.

Not blocking this feature, but flag in handoff.

---

## Low

### L1 — `kudo-compose-modal.tsx` and `image-uploader.tsx` exceed 200-line limit

**File:** `kudo-compose-modal.tsx` (273 lines), `image-uploader.tsx` (213 lines), `tiptap-editor.tsx` (228 lines)

Per CLAUDE.md: "Hold each code file under 200 lines." All three files breach the limit. `kudo-compose-modal.tsx` in particular could extract the `useEffect`-based userId fetch into a `useCurrentUserId()` hook, and the anonymous-section state into `useAnonymousState()`.

### L2 — `recipient-actions.ts` returns `email` field unnecessarily

**File:** `src/features/kudos/recipient-actions.ts:34`

The query selects `email` and the `RecipientResult` interface exposes it. The UI (`recipient-select.tsx`) never renders the email. This sends email addresses to the browser on every keystroke of the recipient search. Drop `email` from the select and interface — it serves no purpose here.

### L3 — `window.prompt` is noted as acceptable per the review spec

**File:** `src/features/kudos/components/tiptap-editor.tsx:159–165`

The plan notes `window.prompt for link is acceptable (note it)`. Noted: it blocks the main thread, is unstyled, and does not work in sandboxed iframes. Address this when the toolbar gets a design update.

### L4 — Tiêu chuẩn cộng đồng button has no-op handler

**File:** `src/features/kudos/components/rich-text-toolbar.tsx:151`

```typescript
onClick={() => {/* Track B wires community-guidelines link */}}
```

Stub comment left in shipped code. Should either wire the URL or remove the button until wired. It's a clickable element with a red label that does nothing — confusing to users.

### L5 — `storagePath` on UploadedImage is non-optional but semantically set only after upload

**File:** `src/features/kudos/components/image-uploader.tsx:13`

`storagePath: string` (non-optional). This is fine since `onAdd` is only called after a successful upload (line 90). But the type does not express this invariant — a future contributor could call `onAdd` with `storagePath: ''` without TypeScript stopping them. Consider making it `storagePath: string & { readonly __brand: 'StoragePath' }` or at minimum add a JSDoc constraint.

---

## Security Checklist Summary

| Check | Result |
|---|---|
| RLS: can user insert kudo as another sender? | SAFE — `kudos_insert_own` enforces `auth.uid() = sender_id`; RPC derives `v_sender_id := auth.uid()` server-side |
| RLS: sender_id trusted from client? | SAFE — RPC ignores any client-supplied sender; uses `auth.uid()` only |
| RPC is `security invoker`? | CONFIRMED (`prosecdef = f`); RLS applies to the calling user's context |
| `content_html` sanitized server-side before insert? | SAFE — `sanitize(contentHtml)` at line 99, `safeHtml` passed to RPC at line 105 |
| Sanitize allowlist permits XSS vectors (`script`, `onerror`, `javascript:`)? | SAFE — only `['p','br','strong','em','s','ul','ol','li','a','blockquote','span']`; `allowedSchemes: ['https','http','mailto']` |
| Self-send blocked? | SAFE — server action line 91 + RPC step 2 + DB CHECK constraint (triple belt-and-suspenders) |
| Hashtag count 1–5 enforced server-side? | SAFE — Zod + RPC step 3 |
| Image count ≤5 enforced server-side? | SAFE — Zod + RPC step 5 |
| Storage folder scoped to `{uid}/`? | SAFE for INSERT (policy enforced); BROKEN for DELETE (no policy) |
| Image paths validated to caller's UID prefix? | MISSING — neither RPC nor `kudo_images` RLS validates path prefix (M3) |
| Anonymous `sender_id` auditable (stored)? | CONFIRMED — column always populated |
| Anonymous `sender_id` hidden from receiver? | DEFERRED to read screens; raw SELECT returns it to all authenticated users |
| DB errors leaking internal schema to client? | BROKEN — `error.message` returned verbatim (H3) |

---

## Positive Observations

- RPC atomicity is correctly designed: single transaction covers all three inserts; any error rolls back cleanly. Client-generated `kudoId` as Storage path prefix is an elegant design that avoids a round-trip to get the server-assigned ID.
- `security invoker` + `set search_path = public` on `create_kudo` is the correct choice. `auth.uid()` resolution is correct for invoker context.
- Sanitize-html is applied **before** the RPC call, not after — correct order. Allowlist is tight and appropriate for Tiptap output.
- Double-submission is protected: `disabled={isSubmitting || disabled}` on the submit button + the mutation's own pending state gate in `handleSubmit`.
- Debounced recipient search with 300 ms prevents query flooding; `staleTime: 5*60*1000` on hashtags avoids repeated fetches of static catalog.
- The seed correctly inserts into `auth.users` first (letting the trigger handle `profiles`), addressing the Validation Log's "FAILED" claim about standalone profile seeding.
- The `eslint-disable-next-line react-hooks/refs` comment is justified and accurate: `mentionItemsRef` is read-only inside deferred suggestion callbacks (not during render), making it a known false-positive pattern.

---

## Recommended Actions (ordered)

1. **C1** — Fix seed UUIDs or loosen `UUID_REGEX`; run `supabase db reset` + full E2E to confirm submit works end-to-end. (Blocks: entire feature unusable with seed data)
2. **H1** — Add Storage DELETE policy to the migration. (Blocks: orphan image accumulation on every cancel/remove)
3. **H3** — Map RPC error codes to friendly messages before returning to client.
4. **H2** — Add URL scheme validation before `setLink`.
5. **M1** — Disable image upload button until `userId` resolves.
6. **M3** — Add UID-prefix path validation in the RPC (one additional guard).
7. **L2** — Drop `email` from `searchRecipients` select and interface.
8. **L4** — Wire or remove the "Tiêu chuẩn cộng đồng" button.
9. **M4** — Document anonymous `sender_id` exposure as a pre-condition for read screen plans.

---

**Status:** DONE_WITH_CONCERNS
**Summary:** Feature architecture is sound — RLS, atomicity, sanitization, and auth-guard are correctly implemented. One critical schema mismatch (seed UUID format vs validation regex) makes the feature non-functional with seed data despite all tests passing. Two high-severity issues (missing DELETE storage policy, raw error leakage to client) must be addressed before shipping.
**Concerns:** C1 is a complete functional break that CI/unit tests do not catch. Fix before any manual QA.
