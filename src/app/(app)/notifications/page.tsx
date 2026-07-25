import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/firebase/session'
import { getUserNotifications } from '@/lib/firestore/notifications'
import { relativeTimeCalendar } from '@/lib/relative-time'
import { ROUTES } from '@/lib/routes'
import { markAllNotificationsRead } from './actions'

export const metadata = { title: 'Notifications — Scholara' }

function notificationTypeLabel(type: string): string {
  return type
    .split('_')
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ')
}

export default async function NotificationsPage() {
  const user = await getServerUser()
  if (!user) redirect(ROUTES.signIn)

  const notifications = await getUserNotifications(user.id)
  const unreadCount = notifications.filter((item) => !item.read).length

  return (
    <div className="notifications-page">
      <Link href={ROUTES.discover} className="paper-detail__back">← Discover</Link>

      <div className="notifications-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            Updates from your applications, applicants, messages, and contributions.
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllNotificationsRead}>
            <button type="submit" className="btn-ghost btn-ghost--compact">
              Mark all read
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="discover-empty">
          <div className="discover-empty__title">No notifications yet</div>
          <div className="discover-empty__text">
            Acceptance updates, new applicants, messages, and contribution changes will appear here.
          </div>
          <Link href={ROUTES.discover} className="btn-primary discover-empty__cta">
            Browse papers
          </Link>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((item) => (
            <Link
              key={item.id}
              href={`${ROUTES.notifications}/${item.id}`}
              className={`notification-card${item.read ? '' : ' notification-card--unread'}`}
            >
              <span className="notification-card__dot" aria-hidden />
              <span className="notification-card__body">
                <span className="notification-card__meta">
                  {notificationTypeLabel(item.type)} · {relativeTimeCalendar(item.created_at)}
                </span>
                <span className="notification-card__message">{item.message}</span>
                {item.preview && (
                  <span className="notification-card__preview">“{item.preview}”</span>
                )}
              </span>
              <span className="notification-card__action">{item.actionLabel}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
