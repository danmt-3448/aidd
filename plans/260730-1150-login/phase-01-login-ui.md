# Phase 01 — Login UI (Track A)

**Track:** A (UI) · **Depends:** none · **Runtime skill:** `momorph-implement-design`

## Goal
Code UI màn Login pixel-perfect từ Figma, mock data lấy từ design. KHÔNG wire logic thật.

## Screen ref
- Login: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
- Clarifications: plans/260730-1150-login/clarifications.md

## Components (từ spec)
- Header: logo Sun* Annual Awards 2025 (trái, không interactive) + Language selector VN (phải)
- Main: hero visual (trang trí) + khối "ROOT FURTHER" / subtitle / tagline + nút "LOGIN With Google"
- Footer: "Bản quyền thuộc về Sun* © 2025" (tĩnh)

## Out of scope (để Track B / integration lo)
- OAuth thật, redirect, loading/error state thật
- Đổi ngôn ngữ thật (chỉ dựng UI selector)
- **KHÔNG thêm control login nào ngoài design** — UI production chỉ nút "Login with Google" (giữ pixel-perfect). Dev-login magic-link là route riêng, không thuộc màn này.

## Integration contract (expose cho Track B)
- `onLoginClick: () => void` + prop `loading: boolean` cho nút Google
- `LanguageSelector` nhận `locale` + `onChange`
- Error message slot (hiển thị khi login fail)

## Done
- Visual diff khớp Figma · responsive 375/768/1280 · compile + lint pass
