/**
 * /notifications/panel — was a dev-only mock gate preview for the notification
 * dropdown panel. The mock system has been removed; real-data sessions are used
 * for gate screenshots instead. Redirect to /notifications.
 */

import { redirect } from 'next/navigation'

export default function NotificationPanelPage() {
  redirect('/notifications')
}
