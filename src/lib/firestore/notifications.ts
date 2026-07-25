import { getAdminDb } from '@/lib/firebase/admin'
import { ROUTES } from '@/lib/routes'
import { sortDocsByCreatedAtDesc } from '@/lib/firestore/sort'

type NotificationPayload = Record<string, unknown>

export type UserNotification = {
  id: string
  type: string
  message: string
  preview: string | null
  read: boolean
  created_at: Date
  actionLabel: string
}

function asPayload(value: unknown): NotificationPayload {
  return value && typeof value === 'object' ? value as NotificationPayload : {}
}

function stringField(payload: NotificationPayload, key: string): string | null {
  const value = payload[key]
  return typeof value === 'string' && value.trim() ? value : null
}

/** Append `from=notifications` so destination pages can send the user back here. */
function fromNotifications(href: string): string {
  if (href === ROUTES.notifications) return href
  return href.includes('?')
    ? `${href}&from=notifications`
    : `${href}?from=notifications`
}

function paperHref(payload: NotificationPayload): string {
  const paperId = stringField(payload, 'paper_id')
  const stageId = stringField(payload, 'stage_id')
  if (!paperId) return ROUTES.discover
  return stageId ? ROUTES.paperManage(paperId, stageId) : ROUTES.paper(paperId)
}

export function getNotificationHref(type: string, rawPayload: unknown): string {
  const payload = asPayload(rawPayload)

  switch (type) {
    case 'application_accepted':
    case 'application_rejected':
      return fromNotifications(ROUTES.workApplications)
    case 'new_applicant':
      return fromNotifications(ROUTES.workApplicants)
    case 'new_message': {
      const applicationId = stringField(payload, 'application_id')
      return fromNotifications(
        applicationId ? ROUTES.message(applicationId) : ROUTES.messages,
      )
    }
    case 'interest_confirmed':
    case 'commitment_confirmed':
    case 'revision_submitted':
    case 'contribution_submitted':
    case 'revision_requested':
    case 'contribution_substantial':
    case 'contribution_not_substantial':
    case 'document_shared':
    case 'slot_reopened':
    case 'slot_expired':
    case 'submission_reminder':
      return fromNotifications(paperHref(payload))
    default:
      return ROUTES.notifications
  }
}

export function getNotificationActionLabel(type: string): string {
  switch (type) {
    case 'application_accepted':
    case 'application_rejected':
      return 'View application'
    case 'new_applicant':
      return 'Review applicant'
    case 'new_message':
      return 'Open message'
    case 'document_shared':
      return 'Open document details'
    case 'revision_requested':
    case 'revision_submitted':
      return 'View revision'
    case 'contribution_submitted':
    case 'interest_confirmed':
    case 'commitment_confirmed':
    case 'contribution_substantial':
    case 'contribution_not_substantial':
      return 'View contribution'
    case 'slot_reopened':
    case 'slot_expired':
    case 'submission_reminder':
      return 'View paper'
    default:
      return 'Open'
  }
}

function fallbackMessage(type: string): string {
  switch (type) {
    case 'application_accepted': return 'Your application was accepted'
    case 'application_rejected': return 'Your application was not selected'
    case 'new_applicant': return 'New application received'
    case 'new_message': return 'You have a new message'
    default: return 'Notification'
  }
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate(): Date }).toDate()
  }
  return new Date()
}

export async function getUserNotifications(userId: string, limit = 75): Promise<UserNotification[]> {
  const snap = await getAdminDb()
    .collection('notifications')
    .where('user_id', '==', userId)
    .get()

  return sortDocsByCreatedAtDesc(snap.docs)
    .slice(0, limit)
    .map((doc) => {
      const data = doc.data()
      const type = (data.type as string | undefined) ?? 'unknown'
      const payload = asPayload(data.payload)
      return {
        id: doc.id,
        type,
        message: (data.message as string | undefined) ?? fallbackMessage(type),
        preview: stringField(payload, 'preview'),
        read: data.read === true,
        created_at: toDate(data.created_at),
        actionLabel: getNotificationActionLabel(type),
      }
    })
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const snap = await getAdminDb()
    .collection('notifications')
    .where('user_id', '==', userId)
    .where('read', '==', false)
    .count()
    .get()

  return snap.data().count
}
