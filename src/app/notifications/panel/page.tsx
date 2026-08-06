/**
 * /notifications/panel — dev-only gate preview for the notification dropdown panel.
 *
 * Renders the NotificationPanel with mock data in a static container so the
 * UI-First Gate (/aidd-ui-gate) can screenshot and property-diff the panel region
 * without needing the bell button + popover interaction.
 *
 * MoMorph frame: gWBVcaSVIf (View thông báo), Figma node 589:9152.
 *
 * Dev-only: ?ui_state=full|empty|error|loading controls mock state.
 * If this route is visited in production it 404s (middleware blocks it).
 * Guard: ONLY renders in NODE_ENV !== 'production' (see proxy.ts ?ui_state= bypass).
 */

import { NotificationPanelPreview } from '@/features/notifications/notification-panel-preview'

export default async function NotificationPanelPage({
  searchParams,
}: {
  searchParams: Promise<{ ui_state?: string }>
}) {
  const { ui_state: uiState } = await searchParams

  // Ensure this route is always accessed with ?ui_state= for the gate.
  // Without it, we still render but with full mock data (sensible default).
  const state = uiState ?? 'full'

  return <NotificationPanelPreview uiState={state} />
}
