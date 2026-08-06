import { LoginScreen } from '@/features/auth/components/login-screen'

/**
 * Trang /login. Guard (middleware) đã lo: user đã đăng nhập vào đây → /.
 * `?error=1` (login fail/hủy từ callback) → hiển thị message.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return <LoginScreen error={error === '1'} />
}
