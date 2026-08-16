/**
 * Route-level loading fallback for App Router `loading.tsx` files.
 *
 * Shown instantly during a route segment's server render (auth resolve + data
 * await) on client navigation — replaces the "frozen previous page" feel with
 * immediate feedback. Mirrors BoardLoadingGate's spinner: brand #FFEA9E on the
 * app's dark background rgba(0,16,26,1) (values taken from the existing gate,
 * not invented). Pure presentational — safe as a Server Component.
 */
export function RouteLoading() {
  return (
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center"
      style={{ backgroundColor: 'rgba(0,16,26,1)' }}
      role="status"
      aria-busy="true"
    >
      <div
        className="h-10 w-10 animate-spin rounded-full"
        style={{ border: '3px solid rgba(255,234,158,0.25)', borderTopColor: '#FFEA9E' }}
      />
    </div>
  )
}
