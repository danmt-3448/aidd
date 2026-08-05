# Phase 04 — Wire Google OAuth + harden prod

**Priority:** Critical · **Status:** pending · **Depends on:** 02, 03 · **Owner role:** deployer / integration-engineer

## Goal
Make Google login work in production by aligning the **three places** that must agree, and lock down prod.

## Context Links
- `src/app/auth/callback/route.ts` — derives `origin` from request; domain-agnostic (no change needed)
- `src/app/login/actions.ts` — builds OAuth `redirectTo` from `origin`/`host` header (no change needed)
- `src/app/dev-login/page.tsx` — 404 unless `NEXT_PUBLIC_ENABLE_DEV_LOGIN==='true'`

## The three places (all must agree)
```
Google Cloud Console          Supabase Auth                    App (already correct)
authorized redirect URI  ───▶ /auth/v1/callback receives  ───▶ redirects to app redirectTo
= https://<ref>.supabase.co   then redirects to allowlisted    = <vercel-domain>/auth/callback
  /auth/v1/callback           Site URL / Redirect URLs
```

## Steps
1. **Google Cloud Console** (APIs & Services → Credentials → OAuth 2.0 Client):
   - Authorized redirect URI: `https://<ref>.supabase.co/auth/v1/callback`
   - Authorized JS origin (if required): the `*.vercel.app` domain
   - **Create a dedicated PROD OAuth client** (separate from the dev one). Copy its `client_id`/`secret` → put in both Supabase (step 2) and Vercel env (Phase 03 table). Keep dev client for local.
2. **Supabase → Authentication → Providers → Google:** enable, paste `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`.
3. **Supabase → Authentication → URL Configuration:**
   - **Site URL** = `https://<your>.vercel.app`
   - **Redirect URLs** allowlist = `https://<your>.vercel.app/**` (covers `/auth/callback` + `next` redirects)
4. **Harden prod:**
   - Confirm `NEXT_PUBLIC_ENABLE_DEV_LOGIN` is **not set** in Vercel → visit `/dev-login` → expect 404.
   - Confirm `service_role` key only in server-scoped Vercel env (never `NEXT_PUBLIC_`).
5. Redeploy if any Vercel env changed.

## Todo
- [ ] Google Console redirect URI → Supabase `/auth/v1/callback`
- [ ] Supabase Google provider enabled with client id/secret
- [ ] Supabase Site URL + Redirect URLs = Vercel domain
- [ ] `/dev-login` returns 404 in prod
- [ ] service_role not exposed to client

## Success Criteria
Full Google OAuth round-trip completes to the app authenticated; dev-login unreachable; no client secret leak.

## Risks
- **#1 deploy failure** = redirect-URI mismatch. Symptom: `redirect_uri_mismatch` (Google) or "requested path is invalid" (Supabase). Fix = align the exact strings; watch trailing slashes.
- **Missing Redirect URLs allowlist entry** → Supabase drops the `next` param / bounces to Site URL.

## Next
Phase 05 smoke-tests the whole flow end-to-end.
