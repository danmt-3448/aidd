'use client'

import { useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UploadedImage } from '../components/image-uploader'

const BUCKET = 'kudo-images'

/**
 * A blob-preview image is one uploaded during THIS modal session (uncommitted):
 * its previewUrl is an object URL (`blob:...`). An "original" image comes from
 * edit-mode initial data (already referenced by DB kudo_images rows) and has an
 * empty previewUrl. The distinction drives when its Storage file may be deleted.
 */
function isBlobImage(img: UploadedImage): boolean {
  return img.previewUrl.startsWith('blob:')
}

async function removeFromStorage(paths: string[]): Promise<void> {
  if (paths.length === 0) return
  try {
    await createClient().storage.from(BUCKET).remove(paths)
  } catch {
    // best-effort — a cleanup failure must never surface to the user
  }
}

/**
 * Orphan-safe Storage cleanup for the Kudo compose modal.
 *
 * Two leaks this closes (see kudo-compose-modal):
 *  1. Edit-mode premature delete — removing an ORIGINAL (already-committed) image
 *     must NOT delete its Storage file immediately, or a subsequent Cancel leaves
 *     the DB row dangling → broken image in the feed. Deletion is DEFERRED until
 *     the update RPC succeeds.
 *  2. Unmount leak — blob images uploaded this session but never submitted must be
 *     removed if the modal is torn down by a path that bypasses handleCancel
 *     (route navigation, tab close, parent unmount).
 *
 * All Storage removals are best-effort and never throw.
 */
export function useKudoImageCleanup(images: UploadedImage[]) {
  // Latest images snapshot for the cancel/unmount handlers (synced post-render).
  const imagesRef = useRef(images)
  useEffect(() => {
    imagesRef.current = images
  }, [images])

  // Original (committed) image paths removed in edit mode — deleted from Storage
  // only after the update succeeds. A ref (nothing renders on it).
  const removedOriginalPaths = useRef<string[]>([])
  // True once the session is finalized (submit succeeded OR explicit cancel), so
  // the unmount effect does not double-delete or delete committed images.
  const finalizedRef = useRef(false)

  /**
   * Called after an image is removed from the form. Blob (uncommitted) images are
   * deleted from Storage immediately; original (committed) images are deferred.
   */
  const handleImageRemoved = useCallback(async (img: UploadedImage) => {
    if (isBlobImage(img)) {
      URL.revokeObjectURL(img.previewUrl)
      if (img.storagePath) await removeFromStorage([img.storagePath])
    } else if (img.storagePath) {
      removedOriginalPaths.current.push(img.storagePath)
    }
  }, [])

  /** Call after the create/update RPC succeeds — flush deferred original deletions. */
  const finalizeOnSuccess = useCallback(() => {
    finalizedRef.current = true
    void removeFromStorage(removedOriginalPaths.current)
  }, [])

  /** Call on explicit cancel — remove uncommitted blob uploads from this session. */
  const finalizeOnCancel = useCallback(async () => {
    finalizedRef.current = true
    const blobs = imagesRef.current.filter(isBlobImage)
    await removeFromStorage(blobs.map((i) => i.storagePath).filter(Boolean))
    blobs.forEach((i) => URL.revokeObjectURL(i.previewUrl))
  }, [])

  // Unmount safety net for bypass paths (navigation, tab close, parent unmount).
  useEffect(() => {
    return () => {
      if (finalizedRef.current) return
      const orphans = imagesRef.current
        .filter(isBlobImage)
        .map((i) => i.storagePath)
        .filter(Boolean)
      void removeFromStorage(orphans)
    }
  }, [])

  return { handleImageRemoved, finalizeOnSuccess, finalizeOnCancel }
}
