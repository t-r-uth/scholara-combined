import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/routes'

export default function ApplicationsRedirect({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string') qs.set(key, value)
    else if (Array.isArray(value)) {
      for (const item of value) qs.append(key, item)
    }
  }
  const query = qs.toString()
  redirect(query ? `${ROUTES.workApplications}?${query}` : ROUTES.workApplications)
}
