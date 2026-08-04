/**
 * Shared time formatting for notification UI components.
 * Formats an ISO8601 string into a human-readable Vietnamese relative-time
 * string (e.g. "5 phút trước", "2 giờ trước", "03/08/2026").
 */
export function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then

  if (diffMs < 60_000) return 'Vừa xong'
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)} phút trước`
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)} giờ trước`
  if (diffMs < 604_800_000) return `${Math.floor(diffMs / 86_400_000)} ngày trước`

  return new Date(isoString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
