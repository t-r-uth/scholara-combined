import type { QueryDocumentSnapshot } from 'firebase-admin/firestore'

export function timestampMillis(value: unknown): number {
  if (!value) return 0
  if (typeof value === 'object' && value !== null && 'toMillis' in value) {
    return (value as { toMillis(): number }).toMillis()
  }
  return new Date(value as string).getTime() || 0
}

export function sortDocsByCreatedAtDesc<T extends QueryDocumentSnapshot>(
  docs: T[]
): T[] {
  return [...docs].sort(
    (a, b) => timestampMillis(b.data().created_at) - timestampMillis(a.data().created_at)
  )
}

export function sortDocsByCreatedAtAsc<T extends QueryDocumentSnapshot>(
  docs: T[]
): T[] {
  return [...docs].sort(
    (a, b) => timestampMillis(a.data().created_at) - timestampMillis(b.data().created_at)
  )
}
