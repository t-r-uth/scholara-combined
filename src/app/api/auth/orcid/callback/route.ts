import { NextRequest, NextResponse } from 'next/server'
import { exchangeOrcidCode } from '@/lib/orcid'
import { adminAuth, db } from '@/lib/firebase/admin'
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'

export const dynamic = 'force-dynamic'

/** Re-attribute all docs in a collection from one uid to another, in chunks of 400. */
async function reAttributeCollection(
  collection: string,
  field: string,
  fromUid: string,
  toUid: string,
  extraFields?: Record<string, unknown>,
) {
  const snap = await db.collection(collection).where(field, '==', fromUid).get()
  if (snap.empty) return

  const chunks: typeof snap.docs[] = []
  for (let i = 0; i < snap.docs.length; i += 400) {
    chunks.push(snap.docs.slice(i, i + 400))
  }
  for (const chunk of chunks) {
    const batch = db.batch()
    for (const doc of chunk) {
      batch.update(doc.ref, { [field]: toUid, ...(extraFields ?? {}) })
    }
    await batch.commit()
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const storedState = request.cookies.get('orcid_state')?.value
  const linkUid = request.cookies.get('orcid_link_uid')?.value
  const isSignin = request.cookies.get('orcid_signin')?.value === '1'
  const origin = new URL(request.url).origin

  const clearCookies = (response: NextResponse) => {
    response.cookies.delete('orcid_state')
    response.cookies.delete('orcid_link_uid')
    response.cookies.delete('orcid_signin')
    return response
  }

  if (!linkUid && !isSignin) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  if (!code || !state || state !== storedState) {
    const errorDestination = isSignin ? '/sign-in?error=orcid' : '/profile/me/edit?orcid=error'
    return clearCookies(NextResponse.redirect(new URL(errorDestination, origin)))
  }

  // ── NEW: sign-in branch — no existing session, look up or create an account ──
  if (isSignin) {
    try {
      const tokenData = await exchangeOrcidCode(code)
      const { orcid: orcidId, name } = tokenData

      const adb = getAdminDb()
      const existing = await adb.collection('users').where('orcid_id', '==', orcidId).limit(1).get()

      let uid: string
      if (!existing.empty) {
        // Returning user
        uid = existing.docs[0].id
      } else {
        // New user — create both the Firebase Auth account and the Firestore profile
        uid = `orcid_${orcidId}`
        await getAdminAuth().createUser({ uid, displayName: name || undefined })
        await adb.collection('users').doc(uid).set({
          display_name: name || '',
          orcid_id: orcidId,
          orcid_verified: true,
          created_at: new Date(),
        })
      }

      const customToken = await getAdminAuth().createCustomToken(uid)
      const response = NextResponse.redirect(
        new URL(`/sign-in/orcid-complete#token=${customToken}`, origin)
      )
      return clearCookies(response)
    } catch (err) {
      console.error('ORCID sign-in error:', err)
      return clearCookies(NextResponse.redirect(new URL('/sign-in?error=orcid', origin)))
    }
  }

  // ── Existing branch below: unchanged — links ORCID to an already-signed-in user ──
  try {
    const tokenData = await exchangeOrcidCode(code)
    const { orcid: orcidId } = tokenData

    const sessionUser = await getServerUser()
    if (!sessionUser || sessionUser.id !== linkUid) {
      return clearCookies(
        NextResponse.redirect(new URL('/profile/me/edit?orcid=error', origin))
      )
    }

    const conflictQuery = await db.collection('users').where('orcid_id', '==', orcidId).limit(2).get()
    const conflictDocs = conflictQuery.docs.filter(d => d.id !== linkUid)

    if (conflictDocs.length > 0) {
      const orphanUid = conflictDocs[0].id
      const isOrcidAccount = orphanUid.startsWith('orcid_')
      if (!isOrcidAccount) {
        return clearCookies(
          NextResponse.redirect(new URL('/profile/me/edit?orcid=conflict', origin))
        )
      }

      const orphanSnap = await db.collection('users').doc(orphanUid).get()
      const orphanData = orphanSnap.data() ?? {}
      const currentSnap = await db.collection('users').doc(linkUid).get()
      const currentData = currentSnap.data() ?? {}

      const profilePatch: Record<string, unknown> = {
        orcid_id: orcidId,
        orcid_verified: true,
      }
      if (!currentData.institution && orphanData.institution) {
        profilePatch.institution = orphanData.institution
      }
      if (!currentData.display_name && orphanData.display_name) {
        profilePatch.display_name = orphanData.display_name
      }

      await Promise.all([
        reAttributeCollection('papers', 'owner_id', orphanUid, linkUid, {
          owner_name: currentData.display_name || orphanData.display_name || null,
          owner_institution: currentData.institution || orphanData.institution || null,
        }),
        reAttributeCollection('applications', 'applicant_id', orphanUid, linkUid),
        reAttributeCollection('contributions', 'contributor_id', orphanUid, linkUid),
      ])

      const batch = db.batch()
      batch.update(db.collection('users').doc(linkUid), profilePatch)
      batch.delete(db.collection('users').doc(orphanUid))
      await batch.commit()

      try { await adminAuth.deleteUser(orphanUid) } catch { /* may not exist */ }
    } else {
      await db.collection('users').doc(linkUid!).update({
        orcid_id: orcidId,
        orcid_verified: true,
      })
    }

    return clearCookies(
      NextResponse.redirect(new URL('/profile/me/edit?orcid=verified', origin))
    )
  } catch (err) {
    console.error('ORCID callback error:', err)
    return clearCookies(
      NextResponse.redirect(new URL('/profile/me/edit?orcid=error', origin))
    )
  }
}