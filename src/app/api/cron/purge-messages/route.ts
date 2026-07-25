import { NextResponse } from 'next/server'
import { assertCronAuthorized, purgeExpiredDocs } from '@/lib/cron'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const unauthorized = assertCronAuthorized(req)
  if (unauthorized) return unauthorized

  const purged = await purgeExpiredDocs('messages')
  return NextResponse.json({ purged })
}
