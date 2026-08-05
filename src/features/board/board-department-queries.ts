'use server'

import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export interface DepartmentRow {
  id: string
  name: string
}

// ---------------------------------------------------------------------------
// listDepartments
//
// Fetches all departments sorted by name.
// Authenticated read (RLS policy: departments_select_authenticated).
// Returns a stable list — departments change rarely; hook applies 5-min staleTime.
// ---------------------------------------------------------------------------

export type ListDepartmentsResult =
  | { data: DepartmentRow[] }
  | { error: string }

export async function listDepartments(): Promise<ListDepartmentsResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('departments')
      .select('id, name')
      .order('name', { ascending: true })

    if (error) {
      console.error('[listDepartments] query', error.message)
      return { error: 'Không thể tải danh sách phòng ban.' }
    }

    const rows: DepartmentRow[] = (data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
    }))

    return { data: rows }
  } catch (err) {
    console.error('[listDepartments] unexpected', err)
    return { error: 'Không thể tải danh sách phòng ban.' }
  }
}
