import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerUser } from '@/lib/firebase/session'
import { getThreadForUser, markThreadRead } from '@/lib/firestore/messages'
import { ROUTES } from '@/lib/routes'
import MessageThread from '@/components/MessageThread'

export const metadata = { title: 'Conversation — Scholara' }

export default async function MessageThreadPage({
  params,
  searchParams,
}: {
  params: { applicationId: string }
  searchParams: { from?: string }
}) {
  const user = await getServerUser()
  if (!user) redirect(ROUTES.signIn)

  const [thread] = await Promise.all([
    getThreadForUser(user.id, params.applicationId),
    markThreadRead(user.id, params.applicationId),
  ])
  if (!thread) notFound()

  const backHref = searchParams.from === 'notifications' ? ROUTES.notifications : ROUTES.messages
  const backLabel = searchParams.from === 'notifications' ? '← Notifications' : '← Messages'

  return (
    <div className="messages-page messages-page--thread">
      <Link href={backHref} className="paper-detail__back">{backLabel}</Link>

      <div className="messages-thread-header">
        <div>
          <h1 className="page-title">{thread.counterpartName}</h1>
          <p className="page-subtitle">
            {thread.stageLabel} ·{' '}
            <Link href={ROUTES.paper(thread.paperId)} className="messages-thread-header__paper">
              {thread.paperTitle}
            </Link>
          </p>
        </div>
      </div>

      <MessageThread
        applicationId={thread.applicationId}
        currentUserId={user.id}
        initialMessages={thread.messages}
      />
    </div>
  )
}
