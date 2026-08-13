# Phase 05 — Client hooks (TanStack Query) (Track B)

**Track:** B (logic) · **Depends:** 04

## Context
Wire server state qua TanStack Query (chưa cài → thêm khi phase này cần). Form state cục bộ (useReducer/zustand nhỏ), zod validate reuse từ phase 04.

## Packages (thêm khi cần)
- `@tanstack/react-query` (+ provider ở `src/lib/query/`), `zod`.
- Editor & toast để dành phase 06 (Tiptap, toast lib).

## Requirements (`src/features/kudos/hooks/`)
- `use-recipient-search.ts`: `useQuery` debounce gọi `searchRecipients`.
- `use-hashtags.ts`: `useQuery` catalog `listHashtags` (staleTime dài).
- `use-create-kudo.ts`: `useMutation` gọi `createKudo`; on success → toast + reset; on error → set field errors.
- QueryClient provider mount ở layout (hoặc host `/kudos`).

## Related files
- Create: 3 hook files + `src/lib/query/query-client.ts` + provider.

## Success criteria
- Hooks trả data thật từ actions; mutation success/error path chạy đúng.
- Không refetch thừa (debounce search, cache catalog).

## Todo
- [ ] Cài + setup TanStack Query provider
- [ ] `use-recipient-search` (debounce)
- [ ] `use-hashtags`
- [ ] `use-create-kudo` (success/error)
