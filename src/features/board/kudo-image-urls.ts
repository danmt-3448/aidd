/**
 * kudo-image-urls.ts — batch signed URL resolution for kudo attached images.
 * Internal server-side helper (imported only by 'use server' query modules);
 * NOT a Server Action file, so it may export sync helpers alongside async ones.
 *
 * The `kudo-images` bucket is PRIVATE; raw storage paths are not loadable URLs.
 * Callers must use createSignedUrls (batch) to get time-limited signed URLs.
 *
 * Design:
 *  - One batch call per feed page (not per image or per card).
 *  - Any signing failure is logged + the path is dropped (card renders without
 *    that image rather than failing the whole feed).
 *  - Returns a Map<storagePath, signedUrl> so callers can look up by path.
 *
 * Expiry: 3600s (1 hour) — appropriate for a read-heavy event board.
 */

import { createClient } from '@/lib/supabase/server'

const BUCKET = 'kudo-images'
const EXPIRY_SECONDS = 3600

/**
 * Given a list of kudo IDs, fetches all kudo_images rows for those IDs (ordered
 * by sort_order) and returns:
 *   - `byKudoId`: Map<kudoId, storage_path[]> — paths in display order
 *   - `signedUrls`: Map<storagePath, signedUrl> — signed URLs for every path
 *
 * Returns empty maps when kudoIds is empty or no images exist.
 * On storage-signing errors the failing paths are omitted (never throws).
 */
export async function fetchKudoImageUrls(kudoIds: string[]): Promise<{
  byKudoId: Map<string, string[]>
  signedUrls: Map<string, string>
}> {
  const empty = {
    byKudoId: new Map<string, string[]>(),
    signedUrls: new Map<string, string>(),
  }

  if (kudoIds.length === 0) return empty

  const supabase = await createClient()

  // Fetch all kudo_images rows for this page's kudo IDs in one query.
  const { data: imageRows, error: imgErr } = await supabase
    .from('kudo_images')
    .select('kudo_id, storage_path, sort_order')
    .in('kudo_id', kudoIds)
    .order('sort_order', { ascending: true })

  if (imgErr) {
    console.error('[fetchKudoImageUrls] kudo_images fetch', imgErr.message)
    return empty
  }

  const rows = imageRows ?? []
  if (rows.length === 0) return empty

  // Build path → kudoId map and ordered lists per kudo.
  const byKudoId = new Map<string, string[]>()
  const allPaths: string[] = []

  for (const row of rows) {
    const kidRow = row as { kudo_id: string; storage_path: string; sort_order: number }
    if (!kidRow.kudo_id || !kidRow.storage_path) continue
    const existing = byKudoId.get(kidRow.kudo_id) ?? []
    existing.push(kidRow.storage_path)
    byKudoId.set(kidRow.kudo_id, existing)
    allPaths.push(kidRow.storage_path)
  }

  if (allPaths.length === 0) return { byKudoId, signedUrls: new Map() }

  // One batch signing call for all paths on this page.
  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(allPaths, EXPIRY_SECONDS)

  if (signErr) {
    console.error('[fetchKudoImageUrls] createSignedUrls', signErr.message)
    // Return byKudoId so callers can skip images gracefully; signedUrls is empty.
    return { byKudoId, signedUrls: new Map() }
  }

  // Build path → signedUrl lookup. Items where signedUrl is null had a signing
  // error for that specific path — drop them silently.
  const signedUrls = new Map<string, string>()
  for (const item of signed ?? []) {
    if (item.signedUrl && item.path) {
      signedUrls.set(item.path, item.signedUrl)
    }
  }

  return { byKudoId, signedUrls }
}

/**
 * Resolves the signed image URLs for a single kudo given the pre-built maps.
 * Returns an empty array when the kudo has no images or signing failed for all.
 */
export function resolveKudoImageUrls(
  kudoId: string,
  byKudoId: Map<string, string[]>,
  signedUrls: Map<string, string>,
): string[] {
  const paths = byKudoId.get(kudoId)
  if (!paths || paths.length === 0) return []
  return paths
    .map((p) => signedUrls.get(p))
    .filter((url): url is string => typeof url === 'string')
}
