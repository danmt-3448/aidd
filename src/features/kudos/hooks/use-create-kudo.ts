'use client'

import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { createKudo, type CreateKudoResult } from '../kudo-actions'
import { type CreateKudoInput } from '../kudo-schema'

export interface UseCreateKudoReturn {
  /** Call this to submit the kudo form. */
  submit: (input: CreateKudoInput) => void
  /** True while the mutation is in-flight. */
  isPending: boolean
  /** Server-side field errors keyed by field name (empty when none). */
  fieldErrors: Record<string, string[]>
  /** True once the mutation completes successfully. */
  isSuccess: boolean
  /** The returned kudoId after a successful submission. */
  kudoId: string | null
  /** Root-level error message (auth failure, unexpected DB error, etc.). */
  rootError: string | null
  /** Reset mutation + error state (call on modal close / form reset). */
  reset: () => void
}

/**
 * Mutation hook for the Viết Kudo form.
 *
 * On success  → caller receives isSuccess=true + kudoId.
 *               Integration layer should fire toast + close modal + reset form.
 * On failure  → fieldErrors and/or rootError are populated for the form to display.
 *
 * Usage:
 *   const { submit, isPending, fieldErrors, isSuccess, reset } = useCreateKudo()
 *   <button onClick={() => submit(formData)} disabled={isPending}>Gửi</button>
 */
export function useCreateKudo(): UseCreateKudoReturn {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [rootError, setRootError] = useState<string | null>(null)
  const [kudoId, setKudoId] = useState<string | null>(null)

  const mutation = useMutation<CreateKudoResult, Error, CreateKudoInput>({
    mutationFn: (input) => createKudo(input),
    onSuccess: (result) => {
      if (result.ok) {
        setFieldErrors({})
        setRootError(null)
        setKudoId(result.kudoId)
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
    setKudoId(null)
  }

  return {
    submit: mutation.mutate,
    isPending: mutation.isPending,
    fieldErrors,
    isSuccess: mutation.isSuccess && kudoId !== null,
    kudoId,
    rootError,
    reset,
  }
}
