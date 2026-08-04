/**
 * Badge image allowlist — pure, client-safe (NOT a 'use server' module).
 *
 * Lives outside secret-box-actions.ts because that file is `'use server'`, which
 * may only export async server actions; a synchronous helper exported from it is
 * stripped on the client and crashes the import. The hook imports badgeAsset here.
 *
 * Never echo a client-supplied URL — only paths from this map are served.
 * "revival" has no dedicated asset yet; mapped to badge-stay-gold.png as a
 * placeholder. Replace with /rules/badge-revival.png when the asset is added.
 */

const BADGE_ASSET_MAP: Record<string, string> = {
  'stay-gold':           '/rules/badge-stay-gold.png',
  'flow-to-horizon':     '/rules/badge-flow-to-horizon.png',
  'touch-of-light':      '/rules/badge-touch-of-light.png',
  'beyond-the-boundary': '/rules/badge-beyond-the-boundary.png',
  'root-further':        '/rules/badge-root-further.png',
  // WORKAROUND: no badge-revival.png asset in public/rules/ yet.
  // Using badge-stay-gold.png as placeholder until the asset is delivered.
  'revival':             '/rules/badge-stay-gold.png',
}

/**
 * Pure allowlist lookup for badge image paths.
 * Returns undefined when the key is unknown — caller should handle gracefully.
 * Never accepts or returns a client-supplied URL.
 */
export function badgeAsset(badgeKey: string): string | undefined {
  return BADGE_ASSET_MAP[badgeKey]
}
