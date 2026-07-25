import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/firebase/session'
import { getUserMessageThreads } from '@/lib/firestore/messages'
import { ROUTES } from '@/lib/routes'

export const metadata = { title: 'Messages — Scholara' }

function relativeTime(ms: number): string {
  const diff = Date.now() - ms
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) {
    const hours = Math.floor(diff / 3_600_000)
    if (hours < 1) return 'Just now'
    return `${hours}h ago`
  }
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export default async function MessagesPage({ searchParams }: { searchParams: { from?: string } }) {
  const user = await getServerUser()
  if (!user) redirect(ROUTES.signIn)

  const threads = await getUserMessageThreads(user.id)

  const backHref = searchParams.from === 'notifications' ? ROUTES.notifications : ROUTES.discover
  const backLabel = searchParams.from === 'notifications' ? '← Notifications' : '← Discover'

  return (
    <div className="messages-page">
      <Link href={backHref} className="paper-detail__back">{backLabel}</Link>

      <div className="messages-header">
        <h1 className="page-title">Messages</h1>
        <p className="page-subtitle">
          Conversations with collaborators after an application is accepted.
        </p>
      </div>

      {threads.length === 0 ? (
        <div className="discover-empty">
          <div className="discover-empty__title">No conversations yet</div>
          <div className="discover-empty__text">
            When you accept an applicant — or get accepted — you can message them here.
          </div>
          <Link href={ROUTES.discover} className="btn-primary discover-empty__cta">
            Browse papers
          </Link>
        </div>
      ) : (
        <div className="messages-list">
          {threads.map((thread) => (
            <Link
              key={thread.applicationId}
              href={ROUTES.message(thread.applicationId)}
              className={`messages-card${thread.unread ? ' messages-card--unread' : ''}`}
            >
              <div className="messages-card__main">
                <div className="messages-card__name">
                  {thread.counterpartName}
                  {thread.unread && <span className="messages-card__unread-dot" aria-label="Unread message" />}
                </div>
                <div className="messages-card__meta">
                  {thread.stageLabel} · {thread.paperTitle}
                </div>
                {thread.lastMessage ? (
                  <p className="messages-card__preview">{thread.lastMessage}</p>
                ) : (
                  <p className="messages-card__preview messages-card__preview--muted">
                    No messages yet — start the conversation
                  </p>
                )}
              </div>
              <div className="messages-card__aside">
                {thread.lastMessageAtMs != null && (
                  <span className="messages-card__date">
                    {relativeTime(thread.lastMessageAtMs)}
                  </span>
                )}
                <span className="messages-card__role">
                  {thread.role === 'owner' ? 'Your paper' : 'Your application'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
