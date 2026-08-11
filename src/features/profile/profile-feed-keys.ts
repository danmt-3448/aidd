/**
 * profile-feed-keys.ts — TanStack Query key factory for the profile feed.
 *
 * Extracted into its own leaf module so `use-toggle-heart.ts` (board feature)
 * can import it without creating a circular dependency:
 *   use-toggle-heart  →  profile-feed-keys  (leaf, no board import)
 * The original home (use-profile-feed.ts) re-exports from here so existing
 * importers keep working.
 */

export const profileFeedKeys = {
  all: ['profile', 'feed'] as const,
  list: (profileId: string, direction: 'received' | 'sent') =>
    [...profileFeedKeys.all, profileId, direction] as const,
}
