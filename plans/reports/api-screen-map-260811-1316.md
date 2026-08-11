# API ↔ Screen Map — AIDD SAA 2025 (snapshot 2026-08-11)

Nguồn: scan `src/features/**` + `supabase/migrations/**`. Ảnh chụp thời điểm; spec sống ở `docs/`.

## Màn hình → phân loại
### Động (có API)
| Màn | Route | API / data layer |
|-----|-------|------------------|
| Board | /board | board-queries (feed←kudos_public) · get_highlight_kudos · get_spotlight_aggregation · get_ranking_leaderboard · get_gift_leaderboard · toggle_heart · profile_stats · hashtag/department list |
| Viết Kudo | /kudos → /board?modal=compose | create_kudo · recipient-actions · hashtag-actions |
| Profile | /profile | profile-queries (feed←kudos_public) · profile_stats |
| Secret box | /secret-box | open_secret_box · secret-box-actions |
| Notifications | /notifications | notification-actions · use-notifications (realtime) |
| Countdown | /countdown | event_config (event_start_at) via feature `event` |
| Homepage | / | composition: notifications bell + countdown + auth |
| Login | /login | Supabase Auth (Google OAuth) — không phải custom API |

### Tĩnh (không API)
| Màn | Route | Nguồn |
|-----|-------|-------|
| Awards | /awards | award-config.ts (static) |
| Rules | /rules | rules-content.ts (static) |

## Shared APIs / features (dùng chung)
| # | Shared | Dùng ở |
|---|--------|--------|
| 1 | getUser() auth guard | mọi server action |
| 2 | profiles table | board · profile · kudo · leaderboard |
| 3 | kudos_public view (mask sender ẩn danh) | board feed · profile feed · highlights |
| 4 | profile_stats view | profile page ↔ board sidebar (use-board-user-stats) |
| 5 | create_kudo RPC | /kudos compose ↔ /board?modal=compose |
| 6 | toggle_heart RPC / hearts | board feed card ↔ highlight carousel |
| 7 | hashtag-actions / department list | kudo compose ↔ board filters |
| 8 | event_config | countdown ↔ pre-launch gate (proxy.ts) ↔ hearts special-multiplier (profile_stats) |
| 9 | notifications | homepage bell ↔ notifications page |

## Nhận xét
- 9 màn design-ready: API đã build đủ (rải qua plan 260731-viet-kudo, 260803-1636-remaining, hardening 260811-0806). Không cần plan API mới.
- 2 màn tĩnh (awards/rules) đúng thiết kế.
- 8 màn spec-in-progress: design chưa ready → chưa plan API.

## Server actions · queries · RPCs · views (inventory)
- actions: board/heart-actions · event/event-actions · kudos/{hashtag,kudo,recipient}-actions · notifications/notification-actions · secret-box/secret-box-actions
- queries: board/{board-queries,board-department-queries,board-leaderboard-queries} · profile/profile-queries
- RPCs: create_kudo · toggle_heart · get_highlight_kudos · get_spotlight_aggregation · get_ranking_leaderboard · get_gift_leaderboard · open_secret_box · notify_on_kudo_insert · handle_new_user
- views: kudos_public · profile_stats
