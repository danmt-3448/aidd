import { createClient } from '@/lib/supabase/server'

/** Placeholder — đích redirect sau đăng nhập. Màn /todo thật sẽ làm sau. */
export default async function TodoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Đăng nhập thành công 🎉</h1>
        {user?.email && <p className="mt-2 text-zinc-600">{user.email}</p>}
        <p className="mt-1 text-sm text-zinc-400">/todo — placeholder (màn tiếp theo).</p>
      </div>
    </main>
  )
}
