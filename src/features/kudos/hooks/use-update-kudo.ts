'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { updateKudo, type UpdateKudoResult } from '../kudo-actions'
import { type UpdateKudoInput } from '../kudo-schema'
import { boardFeedKeys } from '@/features/board/use-board-feed'
import { highlightKeys } from '@/features/board/use-highlights'
import { profileFeedKeys } from '@/features/profile/profile-feed-keys'

export interface UseUpdateKudoReturn {
  /** Call this to submit the edit form. */
  submit: (input: UpdateKudoInput) => void
  /** True while the mutation is in-flight. */
  isPending: boolean
  /** Server-side field errors keyed by field name (empty when none). */
  fieldErrors: Record<string, string[]>
  /** True once the mutation completes successfully. */
  isSuccess: boolean
  /** Root-level error message (auth failure, unexpected DB error, etc.). */
  rootError: string | null
  /** Reset mutation + error state (call on modal close / form reset). */
  reset: () => void
}

/**
 * Mutation hook for the edit-Kudo form.
 *
 * On success  → invalidates board feed, highlights, and profile feed so
 *               updated content appears without a full page reload.
 * On failure  → fieldErrors and/or rootError are populated for the form.
 */
export function useUpdateKudo(): UseUpdateKudoReturn {
  const queryClient = useQueryClient()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [rootError, setRootError] = useState<string | null>(null)

  const mutation = useMutation<UpdateKudoResult, Error, UpdateKudoInput>({
    mutationFn: (input) => updateKudo(input),
    onSuccess: (result) => {
      if (result.ok) {
        setFieldErrors({})
        setRootError(null)
        // Refresh the board + profile feeds so the edited card shows updated content
        void queryClient.invalidateQueries({ queryKey: boardFeedKeys.all })
        void queryClient.invalidateQueries({ queryKey: highlightKeys.all })
        void queryClient.invalidateQueries({ queryKey: profileFeedKeys.all })
      } else {
        const { _root, ...rest } = result.errors
        setFieldErrors(rest)
        setRootError(_root?.[0] ?? null)
      }
    },
    onError: (err) => {
      setRootError(err.message ?? 'Đã xảy ra lỗi không mong muốn')
    },
  })

  function reset() {
    mutation.reset()
    setFieldErrors({})
    setRootError(null)
  }

  return {
    submit: mutation.mutate,
    isPending: mutation.isPending,
    fieldErrors,
    isSuccess: mutation.isSuccess && mutation.data?.ok === true,
    rootError,
    reset,
  }
}
