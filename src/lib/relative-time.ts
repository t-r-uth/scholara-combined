function toMs(value: Date | number): number {
  return typeof value === 'number' ? value : value.getTime()
}

/** Fine-grained relative time for chat/list surfaces: "just now", "5m ago", "3h ago", "2d ago", then a short date. */
export function relativeTimeShort(value: Date | number): string {
  const ms = toMs(value)
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(ms).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
}

/** Coarse relative time for activity feeds: "Today", "Yesterday", "5d ago", "3mo ago", "2y ago". */
export function relativeTimeCalendar(value: Date | number): string {
  const diff = Date.now() - toMs(value)
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}
