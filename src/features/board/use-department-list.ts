'use client'

/**
 * use-department-list.ts — BOARD-DEPT
 *
 * Fetches the full department catalog for the board's "Phòng ban" filter.
 * Reads from listDepartments() server action — no new DB client needed.
 *
 * Returns:
 *   departments  — full {id, name} list
 *   nameToId     — Map<displayName, uuid> for URL-param routing
 */

import { useQuery } from '@tanstack/react-query'
import { listDepartments, type DepartmentRow } from './board-department-queries'

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const departmentListKeys = {
  all: ['board', 'departmentList'] as const,
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseDepartmentListReturn {
  departments: DepartmentRow[]
  /** Map from display name (e.g. "Marketing") to UUID for URL routing. */
  nameToId: Map<string, string>
  isLoading: boolean
  error: string | null
}

// ---------------------------------------------------------------------------
// useDepartmentList
//
// staleTime 5 min — department catalog is effectively static during an event.
// No Realtime subscription needed (departments are seeded, not user-created).
// ---------------------------------------------------------------------------

export function useDepartmentList(): UseDepartmentListReturn {
  const { data, isLoading, error } = useQuery<DepartmentRow[]>({
    queryKey: departmentListKeys.all,
    queryFn: async () => {
      const result = await listDepartments()
      if ('error' in result) throw new Error(result.error)
      return result.data
    },
    staleTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  })

  const departments = data ?? []

  const nameToId = new Map<string, string>(
    departments.map((d) => [d.name, d.id]),
  )

  return {
    departments,
    nameToId,
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}
